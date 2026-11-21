# Plan: Fix Infinite Loading in Appointment Conclusion

The objective is to fix the bug where the "Finalizar Atendimento" button hangs in a loading state indefinitely during the payment registration process.

## 1. Frontend Audit and Fix
- **Problem:** The `handleRegister` function in `PaymentDrawer.tsx` does not have a robust error handling flow that guarantees the loading state is reset if an unexpected error occurs outside of the mutation's internal state management.
- **Solution:** Wrap the logic in a `try...catch...finally` block to ensure `isRegisteringPayment` (linked to `isPending`) is properly handled, or manually manage a local loading state to ensure the UI always unlocks.
- **Action:** Modify `src/components/finance/PaymentDrawer.tsx` to handle the submission state explicitly and safely.

## 2. RPC Audit and Fix
- **Problem:** The `register_appointment_payment` RPC might be failing or timing out due to permission issues, data constraints (like missing snapshots), or lack of proper return paths in all logical branches.
- **Solution:** 
    - Verify that all tables involved (`payments`, `financial_transactions`, `appointments`) have the necessary grants for `authenticated` users.
    - Ensure the RPC returns a consistent JSON structure in all error paths.
    - Check for potential deadlocks or recursive triggers.
- **Action:** Update the RPC definition if needed to ensure robustness.

## 3. Data Layer Validation
- **Problem:** Missing `service_name_snapshot` or `service_price_snapshot` in the `appointments` table might cause the RPC to fail when trying to build the transaction description or amount.
- **Solution:** Ensure the RPC handles null snapshots gracefully.
- **Action:** Update `register_appointment_payment` to provide fallbacks for snapshots.

## Technical Details
- **Affected Files:**
    - `src/components/finance/PaymentDrawer.tsx` (Frontend)
    - `supabase/migrations/` (Backend RPC)
- **Database Changes:** Atomic update of `appointments.status`, `payments`, and `financial_transactions`.
- **Validation:** Use a Playwright script to verify the fix by completing a real appointment and checking if the modal closes and the toast appears.
