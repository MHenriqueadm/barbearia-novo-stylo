# Plan: Public Multi-Tenant Booking Link

Implementation of individual public booking links per barbershop using slugs (e.g., `/:slug/agendar`).

## User Review Required

> [!IMPORTANT]
> - The existing `/agendar` route will remain functional as a fallback during validation.
> - Slugs are unique identifiers for barbershops.

## Proposed Changes

### 1. New Public Route
- Create `src/routes/$slug/agendar/route.tsx` using TanStack Router.
- This route will handle the resolution of the barbershop UUID from the slug.

### 2. Tenant Resolution
- Implement logic to fetch the barbershop by its slug.
- Handle "Barbershop not found" and "Agendamento indisponível" (if `active = false`) states.

### 3. Reusable Booking Component
- Extract the booking logic from `src/routes/agendar/route.tsx` into a reusable component or adapt it to work with a dynamic `barbershopId`.
- Ensure services and professionals are strictly filtered by the resolved `barbershop_id`.

### 4. Admin UI Updates
- **Dashboard**: Update "Seu link de agendamento" to use the new slug-based URL.
- **Settings**: Update the link display in the settings page.

### 5. Verification
- Validate build and type safety.
- Test isolation between different barbershop slugs.

## Technical Details

- **Route**: `/$slug/agendar`
- **Resolution**: `supabase.from('barbershops').select('id, active, ...').eq('slug', slug).single()`
- **Filtering**: All subsequent queries for services and professionals will use the fetched `UUID`.
- **Security**: Leveraging existing RLS policies that already allow public read access for active barbershops and their related data.

## Verbatim Text Update
- Update `src/routes/index.tsx` as requested.
