# Plan: Fix Barbershop Settings and Multi-Tenant Isolation

Fix the `/configuracoes` page to correctly update barbershop identity, logo, and location, ensuring strict multi-tenant isolation and context synchronization.

## 1. Diagnostics & Schema Unification
- Audit current usage of `barbershops.name` vs `barbershop_settings.name`.
- Consolidate identity fields (`name`, `slug`, `logo_url`) to the `barbershops` table as the source of truth.
- Audit RLS policies to ensure authenticated members with an 'owner' or 'admin' role can update their own barbershop data.

## 2. Service Layer Updates (`src/services/barbearia.ts`)
- Refactor `settingsService.updateBarbershopSettings` to update both `barbershops` and `barbershop_settings` as needed, or move identity fields to `barbershops`.
- Update `uploadBarbershopAsset` to use `getPublicUrl` for assets intended for public view (logos, service photos).
- Ensure `logo_url` is saved in the `barbershops` table.

## 3. Hook Layer Updates (`src/hooks/useBarbearia.ts`)
- Ensure `updateSettings` invalidates the relevant queries and triggers a `refresh()` on the `BarbershopContext`.
- Add error handling to provide specific user-friendly messages (e.g., "Slug already in use").

## 4. UI Layer Updates (`src/routes/_authenticated/configuracoes/route.tsx`)
- Ensure the form correctly separates Identity (name, slug, logo) from Location/Contact.
- Use `currentBarbershop.id` for all operations.
- Update UI immediately after successful save using context refresh.
- Implement slug availability validation before saving.

## 5. Multi-Tenant Storage Isolation
- Ensure storage paths follow `barbershops/{barbershop_id}/...`.
- Update RLS for `barbershop-assets` bucket to restrict management to authenticated members of the tenant.

## 6. Verification
- Test identity update (name/slug/logo) and verify Sidebar/Dashboard update.
- Test location/contact update.
- Verify F5 persistence.
- Verify tenant isolation.
- Run production build.

## Technical Details
- **Tables affected**: `barbershops`, `barbershop_settings`.
- **RPCs/Functions**: Might need a helper function for atomic updates if RLS allows.
- **RLS**: Will add `GRANT` statements and verify policies.
