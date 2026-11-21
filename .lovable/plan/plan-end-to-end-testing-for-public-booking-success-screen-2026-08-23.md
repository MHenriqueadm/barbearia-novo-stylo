# Plan - End-to-End Testing for Public Booking Success Screen

Add a robust end-to-end test using Playwright to verify the public booking flow and the final "Reservado!" screen data integrity.

## User Review Required

> [!IMPORTANT]
> The test will use the `restyle` slug and will create a real appointment record in the database during execution.

## Proposed Changes

### Automation & Testing

#### [NEW] `tests/e2e/public-booking.spec.ts`
- Create a Playwright test script that:
    1. Navigates to `/restyle/agendar`.
    2. Selects a service (e.g., "corte").
    3. Selects a professional (e.g., "Otávio Carneiro").
    4. Picks a date and time.
    5. Fills in customer data (name: "E2E Test", phone: "77988227549").
    6. Submits the booking.
    7. Validates the success screen (`Reservado!`).
    8. Verifies that **Serviço**, **Profissional**, **Data**, **Horário**, and the **WhatsApp button** are correctly rendered with the expected values.
    9. Verifies the WhatsApp button link format.

### Documentation

#### `src/routes/index.tsx`
- Update the instruction comment block to reflect the E2E test task.

## Technical Details
- The test will run in the sandbox environment against `http://localhost:8080`.
- I will use existing database records for the "restyle" barbershop.
- I'll ensure the test handles the dynamic date picking by selecting the first available slot.
