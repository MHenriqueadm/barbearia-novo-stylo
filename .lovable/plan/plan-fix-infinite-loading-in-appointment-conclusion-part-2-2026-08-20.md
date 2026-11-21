# Plan: Fix Infinite Loading in Appointment Conclusion - Part 2

The objective is to refine the appointment conclusion and payment registration flow to ensure data integrity, atomicity, and idempotency, while strictly adhering to business rules for different payment methods.

## 1. RPC Refinement (`register_appointment_payment`)
- **Existing Payment Logic:** 
    - Check for an existing payment for the `appointment_id`.
    - If a `paid` payment exists, return a controlled error: "Este atendimento já possui pagamento registrado."
    - If a `pending` payment exists and the new request is `paid`, update the existing payment instead of creating a new one.
- **Idempotency for Transactions:**
    - Before creating a `financial_transaction`, check if one already exists linked to the `payment_id` or `appointment_id`.
    - Ensure only one transaction is created per appointment.
- **Atomicity:**
    - The entire process (updating appointment, creating/updating payment, creating transaction) remains wrapped in the PL/pgSQL function's transaction.
- **Payment Method Validation:**
    - Explicitly handle `pix`, `cash`, `debit_card`, `credit_card`, and `pending`.
    - For `pending`, skip transaction creation.
    - For `cash`, check if a `cash_session` is open (though business logic for physical balance typically relies on transaction queries, we'll ensure it doesn't hang).

## 2. Frontend Validation
- **Requirement:** Confirm the frontend sends the exact lowercase IDs: `pix`, `cash`, `debit_card`, `credit_card`, `pending`.
- **Action:** Already verified in `src/components/finance/PaymentDrawer.tsx`.

## 3. Security & RLS Audit
- **Requirement:** Ensure `authenticated` users have sufficient permissions to execute the RPC and perform the internal table updates.
- **Action:** Verify and re-grant if necessary.

## 4. Trigger Audit
- **Requirement:** Ensure no recursive triggers cause loops.
- **Action:** Verified that existing triggers on `appointments` do not conflict with the `completed` status update.

## Technical Details
- **Database:** Migration to update `register_appointment_payment` with enhanced logic for existing payments and idempotency.
- **Validation:** Direct RPC testing with valid and edge-case parameters (e.g., trying to pay twice).
