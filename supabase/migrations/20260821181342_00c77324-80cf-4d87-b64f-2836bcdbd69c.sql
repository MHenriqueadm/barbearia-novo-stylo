-- 1. Limpar duplicatas se existirem (preservar a mais recente)
DELETE FROM public.payments p1
USING public.payments p2
WHERE p1.appointment_id = p2.appointment_id
  AND p1.id < p2.id;

-- 2. Adicionar constraint UNIQUE em payments(appointment_id)
ALTER TABLE public.payments 
ADD CONSTRAINT payments_appointment_id_key UNIQUE (appointment_id);

-- 3. Garantir unicidade em financial_transactions para evitar duplicação de receita por pagamento
-- Cada pagamento deve ter no máximo uma transação de entrada ativa
CREATE UNIQUE INDEX idx_financial_transactions_payment_income 
ON public.financial_transactions (payment_id) 
WHERE (type = 'income' AND status = 'active');

-- 4. Atualizar a RPC para garantir que o barbershop_id seja sempre preservado e a idempotência seja respeitada
CREATE OR REPLACE FUNCTION public.register_appointment_payment(
  p_appointment_id uuid, 
  p_amount numeric, 
  p_payment_method text, 
  p_status text, 
  p_notes text DEFAULT ''::text
)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- 1. Upsert payment (Agora a constraint UNIQUE existe)
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
    -- A idempotência aqui é garantida pelo index idx_financial_transactions_payment_income
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
    ON CONFLICT (payment_id) WHERE (type = 'income' AND status = 'active')
    DO UPDATE SET
      amount = EXCLUDED.amount,
      payment_method = EXCLUDED.payment_method,
      updated_at = NOW()
    RETURNING id INTO v_transaction_id;
  END IF;

  RETURN json_build_object(
    'success', true, 
    'payment_id', v_payment_id,
    'transaction_id', v_transaction_id
  );
END;
$function$;
