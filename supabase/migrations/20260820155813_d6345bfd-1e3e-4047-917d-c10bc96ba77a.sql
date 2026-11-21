-- Update RPC to handle atomic appointment completion and payment registration with robust null handling
CREATE OR REPLACE FUNCTION public.register_appointment_payment(
    p_appointment_id uuid,
    p_amount numeric,
    p_payment_method text,
    p_status text,
    p_notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_appointment record;
    v_payment_id uuid;
    v_transaction_id uuid;
    v_customer_id uuid;
    v_paid_at timestamptz;
    v_service_name text;
BEGIN
    -- 1. Get appointment info
    SELECT * INTO v_appointment FROM appointments WHERE id = p_appointment_id;
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Atendimento não encontrado.');
    END IF;

    -- 2. Prevent duplicate PAID payments
    IF EXISTS (SELECT 1 FROM payments WHERE appointment_id = p_appointment_id AND status = 'paid') THEN
        RETURN json_build_object('success', false, 'message', 'Este atendimento já possui um pagamento registrado.');
    END IF;

    -- 3. Determine paid_at, customer_id and service_name fallback
    v_customer_id := v_appointment.customer_id;
    v_paid_at := CASE WHEN p_status = 'paid' THEN now() ELSE NULL END;
    v_service_name := COALESCE(v_appointment.service_name_snapshot, 'Serviço');

    -- 4. Create payment record
    INSERT INTO payments (appointment_id, customer_id, amount, payment_method, status, paid_at, notes)
    VALUES (p_appointment_id, v_customer_id, p_amount, p_payment_method, p_status, v_paid_at, p_notes)
    RETURNING id INTO v_payment_id;

    -- 5. Create transaction ONLY if status is PAID
    IF p_status = 'paid' THEN
        INSERT INTO financial_transactions (type, category, description, amount, payment_method, payment_id, appointment_id, customer_id, occurred_at, status)
        VALUES ('income', 'Service', 'Recebimento: ' || v_service_name, p_amount, p_payment_method, v_payment_id, p_appointment_id, v_customer_id, COALESCE(v_paid_at, now()), 'active')
        RETURNING id INTO v_transaction_id;
    END IF;

    -- 6. Atomic status update to COMPLETED
    UPDATE appointments 
    SET status = 'completed', 
        updated_at = now()
    WHERE id = p_appointment_id;

    RETURN json_build_object(
        'success', true, 
        'payment_id', v_payment_id, 
        'transaction_id', v_transaction_id,
        'message', 'Pagamento registrado e atendimento concluído.'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false, 
        'message', 'Erro ao processar: ' || SQLERRM
    );
END;
$$;

-- Ensure grants are correct
GRANT EXECUTE ON FUNCTION public.register_appointment_payment(uuid, numeric, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_appointment_payment(uuid, numeric, text, text, text) TO service_role;
