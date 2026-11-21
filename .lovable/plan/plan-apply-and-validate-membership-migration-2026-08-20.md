# Plan - Apply and Validate Membership Migration

I will apply the SQL migration to clean up duplicate memberships, enforce uniqueness at the database level, and verify the state of the system through both database queries and end-to-end testing.

## Proposed Changes

### Database & Backend
- Apply the migration `supabase/migrations/20260821000000_cleanup_and_idempotency.sql` to the project.
- Verify the unique index `idx_one_active_owner_per_user` exists.
- Clean up active memberships for the test user `8bb107c0-9a0a-42ec-931c-e591d54a0cbc` (only one active owner should remain).

### Testing & Validation
- Run SQL queries to confirm the number of active memberships for the current user.
- Attempt to manually insert a duplicate active membership to verify the index constraint.
- Run a Playwright script to verify navigation stability (F5, login/logout, /onboarding redirect).
- Verify the build integrity.

## Technical Details

- **Migration**: Applies a partial unique index on `barbershop_users` and updates the `create_barbershop_onboarding` RPC to be idempotent.
- **Verification**: Uses `supabase--read_query` to check counts and `lovable auth-session` + Playwright for UI flow testing.
