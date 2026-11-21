# Plan: Fix Dashboard Data and Counters

The dashboard currently shows incorrect data (0 appointments, R$ 0,00 revenue) even when valid completed/paid appointments exist. This is due to timezone mismatches (UTC vs local), incorrect status filtering, and hardcoded logic that doesn't fully respect the multi-tenant architecture.

## User Review Required

> [!IMPORTANT]
> The dashboard will now reflect revenue based on **paid** `payments` and `financial_transactions` associated with the current barbershop. Appointments will be counted based on the barbershop's configured timezone (`America/Bahia`).

- **Revenue Source**: We will use `financial_transactions` of type `income` and status `active` as the source of truth for "Faturamento hoje".
- **Timezone**: All "today" calculations will use `America/Bahia` (the project's defined timezone) instead of the browser's local time or UTC.

## Proposed Changes

### Dashboard Correction
- **Centralize decision logic**: Update `src/routes/_authenticated/dashboard.tsx` to use the correct filtering for "Agendamentos hoje" (include `scheduled`, `confirmed`, `completed`, `no_show`).
- **Revenue Logic**: Fix revenue calculation to only sum `active` income transactions for the current tenant.
- **Timezone Alignment**: Ensure `today` is calculated using `America/Bahia` boundaries.
- **UI Persistence**: Fix the "Agenda de hoje" to show completed appointments instead of hiding them.

### Services and Helpers
- **Barbershop Context**: Ensure `currentBarbershop` is always the source for the tenant ID.
- **Finance Service**: Audit `getTransactions` to ensure it correctly filters by `barbershop_id`.

## Technical Details
- Use `date-fns-tz` to handle `America/Bahia` conversions.
- Update queries in `src/routes/_authenticated/dashboard.tsx` to filter by `currentBarbershop.id`.
- Ensure `transactions` filter in `Dashboard` component correctly identifies income for the current day in the shop's timezone.
- Validate that `uniqueCustomersCount` only counts customers from `completed` appointments today.

## Verification Plan

### Automated Tests
- Run `lovable-exec build` to ensure no type regressions.
- Verify through Playwright that a "CONCLUÍDO" appointment correctly increments the counters.

### Manual Verification
1. Login to a tenant with a completed appointment today.
2. Verify "Agendamentos hoje" > 0.
3. Verify "Faturamento hoje" matches the paid payment.
4. Verify "Agenda de hoje" shows the completed appointment.
5. Switch tenants and verify the dashboard is empty for the new tenant.
