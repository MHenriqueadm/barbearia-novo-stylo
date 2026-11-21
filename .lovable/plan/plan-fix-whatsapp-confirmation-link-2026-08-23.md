# Plan: Fix WhatsApp Confirmation Link

## Goals
Fix the WhatsApp confirmation button in the public booking flow to use the barbershop's configured number, ensure correct message formatting (avoiding "undefined"), and handle missing configurations gracefully.

## Technical Details
- **Official Field**: `public.barbershop_settings.whatsapp`.
- **Normalization**: Remove non-numeric characters and ensure DDI 55 for Brazilian numbers.
- **Tenant Isolation**: Resolve WhatsApp number via the current slug's settings.
- **Message Template**: Include barbershop name, service name (fixed from undefined), date, time, and RST code.
- **Error Handling**: Disable button and show warning if WhatsApp is not configured.

## Steps
1. Audit `src/routes/$slug/agendar/route.tsx` and identify the hardcoded fallback.
2. Implement normalization logic for the WhatsApp number.
3. Fix the message template to use `service_name` from the booking result or selected state.
4. Add conditional rendering/disabling for the WhatsApp button based on settings availability.
5. Update `src/routes/index.tsx` to reflect the completed task.
