# Plan - Fix Availability and Unified Slot Calculation

The goal is to fix the "Indisponível para esta data" error in the Admin Agenda and ensure the availability logic is identical between the admin and public interfaces, handling timezones and business rules correctly.

## Proposed Changes

### 1. Unified Availability Logic (src/services/availability.ts)
- **Timezone Awareness**: Ensure `parseISO(date)` doesn't shift the day due to UTC conversion. Use `parseTenantDateTime` logic or ensure `selectedDate` represents the day at midnight in the tenant's timezone.
- **Weekday Mapping**: Explicitly handle the weekday to match `business_hours` and `professional_schedules` (0=Sunday to 6=Saturday).
- **Graceful Fallback**: Ensure that if `allProfessionalsSchedules` is empty or missing a day, it falls back to the shop's `business_hours` correctly.
- **Filtering Logic**: Fix the `isAvailable` check for today's date to ensure slots in the near future are correctly calculated considering the `-3h` offset of `America/Bahia`.

### 2. Admin Agenda Integration (src/routes/_authenticated/agenda/route.tsx)
- **State Consistency**: Ensure the `NewBookingDrawer` correctly passes all required data (schedules, breaks, blocks) to `availabilityService.getAvailableSlots`.
- **Query Optimization**: Check if `useProfessionalSchedule`, `useProfessionalBreaks`, and `useProfessionalBlocks` are fetching the correct data for the selected professional.

### 3. Data Integrity & Multi-Tenancy
- Verify that `barbershop_id` is passed correctly in all queries.
- Ensure that `existingAppointments` are correctly fetched for the targeted date and professional.

## Technical Details
- Use `formatInTimeZone` and `toDate` from `date-fns-tz` to maintain `America/Bahia` as the source of truth.
- Standardize slot generation: `currentSlot` initialization and `while` loop boundaries.
- Ensure `slotEnd` fits within `endTime`.

## Verification Plan
- **Manual/Playwright Audit**:
  - Check Public Booking for 'restyle' at `/restyle/agendar` (should show slots for tomorrow).
  - Check Admin Agenda > Novo Agendamento (should show identical slots for the same date/professional/service).
- **Edge Cases**:
  - Test for "today" to confirm only future slots appear.
  - Test a day where the professional has an explicit block or break.
  - Test a day where the professional doesn't have a specific schedule (should use shop hours).
