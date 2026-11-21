# Plan: Correcting `create_public_appointment` RPC in Database

The goal is to fix the "function not found" error by ensuring the database has a `create_public_appointment` function that matches the frontend's expected signature and supports multi-tenancy.

## Proposed Changes

### Database (Supabase)
1. **Migration File**: Create a new migration to redefine the `create_public_appointment` function.
2. **Function Signature**: Use the exact parameter names sent by the frontend:
   - `p_service_id` (uuid)
   - `p_professional_id` (uuid)
   - `p_start_at` (timestamptz)
   - `p_customer_name` (text)
   - `p_customer_phone` (text)
   - `p_notes` (text)
   - `p_barbershop_id` (uuid)
3. **Multi-Tenant Validation**:
   - Ensure the `barbershop_id` exists.
   - Validate that `service_id` and `professional_id` belong to the provided `barbershop_id`.
   - Check availability specifically for that tenant/professional.
4. **Permissions**: Explicitly `GRANT EXECUTE` to `anon` and `authenticated` roles.
5. **Schema Cache**: Use `NOTIFY pgrst, 'reload schema';` within the migration to ensure the change is immediately visible to the API.

### Verification
1. **Direct RPC Call**: Test the function using a raw SQL call or the `supabase.rpc` tool to ensure it no longer returns 404.
2. **End-to-End Test**: Perform a booking on the public page (`/$slug/agendar`) and verify:
   - Success toast appears.
   - Appointment is created in the database with the correct `barbershop_id`.
   - Appointment appears in the admin agenda.

## Technical Details
- **Current Signature**: `(p_service_id uuid, p_professional_id uuid, p_start_at timestamptz, p_customer_name text, p_customer_phone text, p_notes text)` (Missing `p_barbershop_id`).
- **Frontend Call**: Sends 7 parameters including `p_barbershop_id`.
- **Constraint**: No changes to frontend code or visual elements.
