# Plan: Final Fix for `customer_name` NOT NULL violation in Public Booking

The public booking flow is failing because the `create_public_appointment` RPC does not include `customer_name` and `customer_phone` in the `INSERT` statement for the `appointments` table, which are required (NOT NULL) columns.

## Steps

1. **Audit RPC signatures**: Confirmed only one `create_public_appointment` version exists (OID 18798).
2. **Normalize and Validate Inputs**: Update the RPC to trim and validate `p_customer_name` to prevent empty strings or nulls.
3. **Fix the Appointment INSERT**: Update the `INSERT INTO public.appointments` block to explicitly include `customer_name` and `customer_phone` from the input parameters.
4. **Populate Snapshots (Optional but Recommended)**: Populate `service_name_snapshot`, `service_price_snapshot`, and `service_duration_snapshot` to maintain record integrity even if the service is deleted/modified later.
5. **Set Source**: Set the `source` column to `'public_booking'` instead of the default `'admin'`.
6. **Verify Frontend**: Check `src/routes/$slug/agendar/route.tsx` to ensure `customerName` is correctly passed.

## Technical Details

- **RPC Signature**: `public.create_public_appointment(p_service_id uuid, p_professional_id uuid, p_start_at timestamp with time zone, p_customer_name text, p_customer_phone text, p_notes text, p_barbershop_id uuid, p_whatsapp_consent boolean, p_whatsapp_consent_at timestamp with time zone)`
- **Migration**: Use `CREATE OR REPLACE FUNCTION` to update the existing logic.
- **Constraints**: Maintain the `barbershop_id + phone_normalized` logic for customer identification.
