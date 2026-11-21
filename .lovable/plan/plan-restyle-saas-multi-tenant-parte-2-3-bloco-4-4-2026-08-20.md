# Plan - RESTYLE SaaS Multi-tenant (Parte 2/3 - Bloco 4/4)

Finalize the multi-tenant isolation by implementing Row Level Security (RLS) policies and verifying the onboarding/tenant switching flow.

## 1. Row Level Security (RLS)

Apply tenant isolation policies to all core tables using the `barbershop_id` column and the user's membership in `barbershop_users`.

### Table: barbershop_users
- `SELECT`: Users can see their own memberships.
- `INSERT/UPDATE/DELETE`: `service_role` only (managed via onboarding RPC or admin).

### Tables: appointments, customers, services, professionals, financial_transactions, cash_sessions, barbershop_settings, business_hours, business_breaks, professional_services, professional_schedules, professional_breaks, professional_blocks
- `SELECT/INSERT/UPDATE/DELETE`: Authenticated users can access rows where `barbershop_id` matches a barbershop they belong to in `barbershop_users`.
- `anon`: `SELECT` access for `services`, `professionals`, `business_hours`, `business_breaks`, `barbershops`, and `barbershop_settings` (limited columns) where the barbershop is active (required for the public booking flow).

## 2. Testing & Verification

### Onboarding Flow
- Verify that a new user (e.g., "Marcelo Henrique") is redirected to `/onboarding`.
- Complete onboarding and verify atomic creation of barbershop, settings, membership, and hours.
- Confirm the Dashboard is empty for the new tenant.

### Tenant Isolation
- Verify that Marcelo cannot see Otávio's data (services, appointments, etc.).
- Verify that logging back in as Otávio restores his historical data and hides Marcelo's.
- Verify that refreshing the page (F5) maintains the correct `currentBarbershop` context.

### RLS Hardening
- Attempt to access a record from a different tenant directly via the API to confirm RLS blockage.

## Technical Details

### RLS Policies Example
```sql
CREATE POLICY "Users can access their own tenant data" ON public.appointments
FOR ALL TO authenticated
USING (
  barbershop_id IN (
    SELECT barbershop_id FROM public.barbershop_users WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  barbershop_id IN (
    SELECT barbershop_id FROM public.barbershop_users WHERE user_id = auth.uid()
  )
);
```

### Build & Typecheck
- Run `npm run typecheck` and `npm run build` to ensure no regressions.
