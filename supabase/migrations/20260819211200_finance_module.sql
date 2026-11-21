-- Create payments table
CREATE TABLE public.payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
    customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
    amount numeric NOT NULL,
    payment_method text NOT NULL,
    status text NOT NULL DEFAULT 'paid',
    paid_at timestamptz,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create financial_transactions table
CREATE TABLE public.financial_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL, -- 'income' or 'expense'
    category text,
    description text NOT NULL,
    amount numeric NOT NULL,
    payment_method text,
    payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
    appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
    customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
    occurred_at timestamptz NOT NULL,
    status text DEFAULT 'active', -- 'active' or 'cancelled'
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create cash_sessions table
CREATE TABLE public.cash_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    opened_at timestamptz NOT NULL,
    closed_at timestamptz,
    opening_balance numeric NOT NULL DEFAULT 0,
    expected_closing_balance numeric,
    counted_closing_balance numeric,
    difference numeric,
    status text NOT NULL DEFAULT 'open', -- 'open' or 'closed'
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    -- Ensure only one open session at a time
    CONSTRAINT only_one_open_session EXCLUDE USING gist (status WITH =) WHERE (status = 'open')
);

-- Add GIST extension if not exists for the constraint
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_transactions TO authenticated;
GRANT ALL ON public.financial_transactions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_sessions TO authenticated;
GRANT ALL ON public.cash_sessions TO service_role;

-- Policies (Simplified for admin-only project)
CREATE POLICY "Enable all for authenticated users" ON public.payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.financial_transactions FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.cash_sessions FOR ALL TO authenticated USING (true);

-- RPC for atomic payment registration
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
BEGIN
    -- 1. Get appointment info
    SELECT * INTO v_appointment FROM appointments WHERE id = p_appointment_id;
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Appointment not found');
    END IF;

    -- 2. Prevent duplicate payment if already paid
    IF EXISTS (SELECT 1 FROM payments WHERE appointment_id = p_appointment_id AND status = 'paid') THEN
        RETURN json_build_object('success', false, 'message', 'Este atendimento já possui um pagamento registrado.');
    END IF;

    v_customer_id := v_appointment.customer_id;
    v_paid_at := CASE WHEN p_status = 'paid' THEN now() ELSE NULL END;

    -- 3. Create or update payment
    INSERT INTO payments (
        appointment_id, 
        customer_id, 
        amount, 
        payment_method, 
        status, 
        paid_at, 
        notes
    )
    VALUES (
        p_appointment_id, 
        v_customer_id, 
        p_amount, 
        p_payment_method, 
        p_status, 
        v_paid_at, 
        p_notes
    )
    RETURNING id INTO v_payment_id;

    -- 4. Create transaction if paid
    IF p_status = 'paid' THEN
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
            'Recebimento: ' || v_appointment.service_name_snapshot,
            p_amount,
            p_payment_method,
            v_payment_id,
            p_appointment_id,
            v_customer_id,
            v_paid_at,
            'active'
        )
        RETURNING id INTO v_transaction_id;
    END IF;

    RETURN json_build_object(
        'success', true, 
        'payment_id', v_payment_id,
        'transaction_id', v_transaction_id
    );
END;
$$;
