CREATE OR REPLACE FUNCTION public.register_appointment_payment(p_appointment_id uuid, p_amount numeric, p_payment_method text, p_status text, p_notes text DEFAULT ''::text)
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
  v_method TEXT;
  v_amount NUMERIC;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'message', 'Informe um valor válido para o recebimento.');
  END IF;

  v_amount := round(p_amount::numeric, 2);
  v_method := lower(trim(coalesce(p_payment_method, '')));

  SELECT barbershop_id, service_name_snapshot, customer_name, status
  INTO v_barbershop_id, v_service_name, v_customer_name, v_appointment_status
  FROM appointments
  WHERE id = p_appointment_id;

  IF v_barbershop_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Appointment not found');
  END IF;

  IF NOT public.check_is_barbershop_member(v_barbershop_id) THEN
    RETURN json_build_object('success', false, 'message', 'Não autorizado');
  END IF;

  -- Serialize concurrent confirmations for the same appointment
  PERFORM pg_advisory_xact_lock(hashtextextended(p_appointment_id::text, 0));

  INSERT INTO payments (
    appointment_id, barbershop_id, amount, payment_method, status, notes
  ) VALUES (
    p_appointment_id, v_barbershop_id, v_amount, v_method, p_status, p_notes
  )
  ON CONFLICT (appointment_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    amount = EXCLUDED.amount,
    payment_method = EXCLUDED.payment_method,
    notes = EXCLUDED.notes,
    updated_at = NOW()
  RETURNING id INTO v_payment_id;

  -- Persist the final charged amount on the appointment itself (never touches services.price)
  UPDATE appointments
  SET service_price_snapshot = v_amount,
      status = CASE WHEN status <> 'completed' THEN 'completed' ELSE status END,
      updated_at = NOW()
  WHERE id = p_appointment_id;

  IF p_status = 'paid' THEN
    INSERT INTO financial_transactions (
      barbershop_id, payment_id, appointment_id, type, amount, description, payment_method, occurred_at, status
    ) VALUES (
      v_barbershop_id, v_payment_id, p_appointment_id, 'income', v_amount,
      'Atendimento: ' || COALESCE(v_service_name, 'Serviço') || ' - ' || COALESCE(v_customer_name, 'Cliente'),
      v_method, NOW(), 'active'
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
    'transaction_id', v_transaction_id,
    'amount', v_amount
  );
END;
$function$;