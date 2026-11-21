# Plan: RESTYLE — CORREÇÃO CRÍTICA FINALIZAÇÃO DO ATENDIMENTO (4/4)

Finalização da correção crítica para garantir que o fluxo de pagamento seja robusto, sem duplicidades e com feedback visual correto.

## Proposed Changes

### Database (Supabase)
- Refine the `register_appointment_payment` RPC to strictly enforce idempotency.
- Add checks to prevent multiple `financial_transactions` for the same `payment_id` even if called concurrently.
- Standardize all payment methods to lowercase internally.
- Ensure the atomic block correctly handles errors without leaving the appointment in a partial state.

### Data Layer & Services
- Update `src/services/finance.ts` to improve error mapping, providing clearer messages to the frontend.
- Update `src/hooks/useFinance.ts` to ensure consistent cache invalidation across all related entities (appointments, payments, transactions, summaries).

### Interface (Frontend)
- **PaymentDrawer.tsx**:
  - Implement a visual indicator that clearly shows when a payment is already registered (to prevent duplicate attempts if the user manages to re-open the drawer).
  - Improve the error handling display: when the backend returns a specific error (like "already paid"), show a tailored message instead of a generic one.
  - Verify the 15s timeout logic and ensure it doesn't trigger if the server responds slightly late but successfully.
  - Ensure the "Finalizando..." state is visually distinct and disables all interactions.

## Technical Details
- **RPC Logic**:
  - `IF EXISTS (SELECT 1 FROM payments WHERE appointment_id = ... AND status = 'paid')` -> Return success/error appropriately.
  - Normalize `p_payment_method` to `lower()`.
  - Wrap all operations in a transaction (implicit in RPC).
- **Cache**: Use `queryClient.invalidateQueries` for `['appointments']`, `['financial-transactions']`, `['dashboard-summary']`.
- **UI State**: Ensure `isSubmitting` is handled in `finally` and `onSuccess` only triggers when `success: true` is returned.

## Test Plan
- [ ] **Pix/Cash/Debit/Credit**: Test each method and verify transaction creation.
- [ ] **Pending**: Verify it creates a payment but NO transaction, then completing it later updates correctly.
- [ ] **Duplicity**: Try to call the RPC twice for the same appointment; the second must fail or be a no-op.
- [ ] **Error Handling**: Temporarily break the RPC to verify the loading spinner disappears and the button becomes clickable again.
- [ ] **Real-time**: Verify Dashboard revenue updates immediately after closing a payment.
