-- 1. Fix register_appointment_payment to ensure barbershop_id is correctly propagated and prevent double transactions
CREATE OR REPLACE FUNCTION public.register_appointment_payment(
  p_appointment_id UUID,
  p_amount NUMERIC,
  p_payment_method TEXT,
  p_status TEXT,
  p_notes TEXT DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_barbershop_id UUID;
  v_payment_id UUID;
  v_transaction_id UUID;
  v_service_name TEXT;
  v_customer_name TEXT;
  v_appointment_status TEXT;
BEGIN
  -- Get appointment details and barbershop_id
  SELECT barbershop_id, service_name_snapshot, customer_name, status
  INTO v_barbershop_id, v_service_name, v_customer_name, v_appointment_status
  FROM appointments
  WHERE id = p_appointment_id;

  IF v_barbershop_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Appointment not found');
  END IF;

  -- 1. Upsert payment
  INSERT INTO payments (
    appointment_id,
    barbershop_id,
    amount,
    payment_method,
    status,
    notes
  ) VALUES (
    p_appointment_id,
    v_barbershop_id,
    p_amount,
    p_payment_method,
    p_status,
    p_notes
  )
  ON CONFLICT (appointment_id) 
  DO UPDATE SET
    status = EXCLUDED.status,
    amount = EXCLUDED.amount,
    payment_method = EXCLUDED.payment_method,
    notes = EXCLUDED.notes,
    updated_at = NOW()
  RETURNING id INTO v_payment_id;

  -- 2. Update appointment status to completed if not already
  IF v_appointment_status != 'completed' THEN
    UPDATE appointments 
    SET status = 'completed', updated_at = NOW()
    WHERE id = p_appointment_id;
  END IF;

  -- 3. Create financial transaction if paid and doesn't exist yet
  IF p_status = 'paid' THEN
    -- Check for existing active income transaction for this payment
    SELECT id INTO v_transaction_id
    FROM financial_transactions
    WHERE payment_id = v_payment_id AND type = 'income' AND status = 'active';

    IF v_transaction_id IS NULL THEN
      INSERT INTO financial_transactions (
        barbershop_id,
        payment_id,
        type,
        amount,
        description,
        payment_method,
        occurred_at,
        status
      ) VALUES (
        v_barbershop_id,
        v_payment_id,
        'income',
        p_amount,
        'Atendimento: ' || COALESCE(v_service_name, 'Serviço') || ' - ' || COALESCE(v_customer_name, 'Cliente'),
        p_payment_method,
        NOW(),
        'active'
      )
      RETURNING id INTO v_transaction_id;
    END IF;
  END IF;

  RETURN json_build_object(
    'success', true, 
    'payment_id', v_payment_id,
    'transaction_id', v_transaction_id
  );
END;
$$;

-- 2. Backfill missing barbershop_id in payments and financial_transactions
UPDATE public.payments p
SET barbershop_id = a.barbershop_id
FROM public.appointments a
WHERE p.appointment_id = a.id AND p.barbershop_id IS NULL;

UPDATE public.financial_transactions ft
SET barbershop_id = p.barbershop_id
FROM public.payments p
WHERE ft.payment_id = p.id AND ft.barbershop_id IS NULL;

-- 3. Backfill missing financial_transactions for paid payments
INSERT INTO public.financial_transactions (
    barbershop_id,
    payment_id,
    type,
    amount,
    description,
    payment_method,
    occurred_at,
    status
)
SELECT 
    p.barbershop_id,
    p.id as payment_id,
    'income' as type,
    p.amount,
    'Backfill: Atendimento - ' || a.customer_name as description,
    p.payment_method,
    COALESCE(p.created_at, NOW()) as occurred_at,
    'active' as status
FROM public.payments p
JOIN public.appointments a ON p.appointment_id = a.id
LEFT JOIN public.financial_transactions ft ON p.id = ft.payment_id AND ft.type = 'income' AND ft.status = 'active'
WHERE p.status = 'paid' 
  AND ft.id IS NULL
  AND p.barbershop_id IS NOT NULL;