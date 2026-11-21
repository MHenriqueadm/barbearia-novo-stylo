# Plan: Pending Payments Card Correction

Correct the "Pendente" card in the Finance module to accurately reflect all unpaid appointments from the `payments` table, ensuring consistency between the Agenda and Finance dashboard.

## Proposed Changes

### Database & Service Layer
- **No RPC changes**: The current `register_appointment_payment` RPC already handles status updates correctly.
- **Service Enhancement**: Add `getPendingTotal` to `financeService` in `src/services/finance.ts` to fetch the sum of all payments with `status = 'pending'`.

### Data Layer (Hooks)
- **New Query**: Add `usePendingPayments` hook in `src/hooks/useFinance.ts` to fetch the cumulative pending amount.
- **Cache Invalidation**: Ensure all relevant queries (`payments`, `financial-summary`, `financial-transactions`, `dashboard-summary`) are invalidated when a payment is registered or received.

### UI Implementation
- **Dashboard (`src/routes/index.tsx`)**: Update the header/top-level summary (if applicable) or simply verify alignment.
- **Finance Page (`src/routes/financeiro/route.tsx`)**: 
    - Replace the hardcoded `R$ 0,00` in the "Pendente" card with real data from the new hook.
    - The "Pendente" card will show the total sum of ALL pending payments (cumulative), not just today's, as requested.

## Technical Details
- **Filtering**: Realized revenue (Entradas) will continue to filter by the selected date range and `status = 'active'`.
- **Cumulative Logic**: Pending amount will ignore date filters to show "Total Debt".
- **Atomic updates**: Confirming a pending payment triggers the RPC which updates the existing payment row and creates a single transaction.

## Verification Plan
1. **Manual Check**: Verify that an appointment marked as "Pendente" (R$ 30,00) appears in the Finance card.
2. **Atomic Flow**: Simulate "Receber agora" for a pending payment and verify:
    - Pendente decreases by the amount.
    - Entradas increases by the amount.
    - One new transaction appears in the history.
3. **Cache Check**: Ensure UI updates immediately without page refresh.
