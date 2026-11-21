# Plan: Cleanup Prompts and Restore Proper Routing

The project has instructions and prompts visible in the UI, especially at the root path (`/`). This plan details how to remove this noise and restore the correct multi-tenant redirection logic.

## Steps

1. **Remove Prompts from `src/routes/index.tsx`**: Replace the instruction-heavy content with a proper logic-based component that redirects users based on their auth and barbershop status.
2. **Global Audit**: Confirm no other files contain prompt fragments using `grep`.
3. **Restore Redirection Logic**:
   - Authenticated with barbershop -> `/dashboard`
   - Authenticated without barbershop -> `/onboarding`
   - Unauthenticated -> `/auth`
4. **Verification**:
   - Run `typecheck` and `build`.
   - Test preview for all major route categories.

## Technical Details

- **File**: `src/routes/index.tsx`
- **Hook**: `useAccessState` will be used to determine the user's status.
- **Navigation**: `useNavigate` from `@tanstack/react-router` for deterministic redirects.
- **Timezone**: Ensure `America/Bahia` remains the default for any logic applied.
