-- Update the register_appointment_payment RPC with enhanced logic
CREATE OR REPLACE FUNCTION public.register_appointment_payment(
    p_appointment_id uuid, 
    p_amount numeric, 
    p_payment_method text, 
    p_status text, 
    p_notes text DEFAULT NULL::text
)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_appointment record;
    v_existing_payment record;
    v_payment_id uuid;
    v_transaction_id uuid;
    v_customer_id uuid;
    v_paid_at timestamptz;
    v_service_name text;
    v_cash_session_id uuid;
    v_payment_method_normalized text;
BEGIN
    -- 1. Standardize payment method to lowercase
    v_payment_method_normalized := lower(p_payment_method);

    -- 2. Get appointment info
    SELECT * INTO v_appointment FROM appointments WHERE id = p_appointment_id;
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Atendimento não encontrado.');
    END IF;

    -- 3. Check for existing payment
    SELECT * INTO v_existing_payment FROM payments WHERE appointment_id = p_appointment_id;
    
    IF FOUND THEN
        -- If already paid, block
        IF v_existing_payment.status = 'paid' THEN
            RETURN json_build_object('success', false, 'message', 'Este atendimento já possui pagamento registrado.');
        END IF;
        
        -- If existing is pending and new status is paid, update it
        IF v_existing_payment.status = 'pending' AND p_status = 'paid' THEN
            UPDATE payments 
            SET status = 'paid',
                payment_method = v_payment_method_normalized,
                amount = p_amount,
                paid_at = now(),
                notes = p_notes,
                updated_at = now()
            WHERE id = v_existing_payment.id
            RETURNING id INTO v_payment_id;
        ELSE
            -- If it's still pending or other cases, just use the existing ID
            v_payment_id := v_existing_payment.id;
        END IF;
    ELSE
        -- 4. Create new payment record if none exists
        v_customer_id := v_appointment.customer_id;
        v_paid_at := CASE WHEN p_status = 'paid' THEN now() ELSE NULL END;
        
        INSERT INTO payments (appointment_id, customer_id, amount, payment_method, status, paid_at, notes)
        VALUES (p_appointment_id, v_customer_id, p_amount, v_payment_method_normalized, p_status, v_paid_at, p_notes)
        RETURNING id INTO v_payment_id;
    END IF;

    -- 5. Handle Transaction (Idempotency)
    -- Only create if status is PAID and no transaction exists for this payment yet
    IF p_status = 'paid' THEN
        IF NOT EXISTS (SELECT 1 FROM financial_transactions WHERE payment_id = v_payment_id) THEN
            -- Check for open cash session if method is cash
            IF v_payment_method_normalized = 'cash' THEN
                SELECT id INTO v_cash_session_id FROM cash_sessions WHERE status = 'open' LIMIT 1;
            END IF;

            v_service_name := COALESCE(v_appointment.service_name_snapshot, 'Serviço');

            INSERT INTO financial_transactions (
                type, 
                category, 
                description, 
                amount, 
                payment_method, 
                payment_id, 
                appointment_id, 
                customer_id, 
                occurred_at, 
                status
            )
            VALUES (
                'income', 
                'Service', 
                'Recebimento: ' || v_service_name, 
                p_amount, 
                v_payment_method_normalized, 
                v_payment_id, 
                p_appointment_id, 
                v_appointment.customer_id, 
                now(), 
                'active'
            )
            RETURNING id INTO v_transaction_id;
        ELSE
            -- Transaction already exists, just get its ID
            SELECT id INTO v_transaction_id FROM financial_transactions WHERE payment_id = v_payment_id LIMIT 1;
        END IF;
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
        'message', 'Pagamento processado e atendimento concluído.'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false, 
        'message', 'Erro ao processar: ' || SQLERRM
    );
END;
$function$;

-- Ensure permissions
GRANT EXECUTE ON FUNCTION public.register_appointment_payment(uuid, numeric, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_appointment_payment(uuid, numeric, text, text, text) TO service_role;
