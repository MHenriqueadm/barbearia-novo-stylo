# Plan: Fix Onboarding Crash and Data Isolation

Identify and resolve the "This page didn't load" crash occurring after onboarding, ensuring a smooth transition to the dashboard and robust multi-tenant isolation.

## Analysis
- The "This page didn't load" error is likely a runtime crash caused by accessing `null` properties of `currentBarbershop` before it's fully loaded or when a user has no membership yet.
- A redirect loop exists between `/dashboard` (via `/_authenticated`) and `/auth` because the auth gate and context provider might be fighting over the loading state or redirect logic.
- The root redirect in `src/routes/index.tsx` to `/dashboard` triggers the `_authenticated` layout, which may not handle the transition from "no membership" (pre-onboarding) to "membership created" (post-onboarding) atomically.

## Proposed Changes

### 1. Data Context Hardening
- **BarbershopContext.tsx**: Improve `BarbershopProvider` to handle state transitions better. Add a way to refresh the membership after onboarding without a full page reload, or ensure the full page reload actually works by cleaning up transient state.
- **AppLayout Components**: Audit `Sidebar` and other layout components to ensure they never access `currentBarbershop` properties without checking for existence.

### 2. Auth Gate Refinement
- **src/routes/_authenticated/route.tsx**: Refactor `AdminLayout` redirect logic.
  - Ensure it waits for both `authLoading` and `shopLoading` to be false.
  - Fix the condition that prevents redirect loops to `/auth`.
  - Add specific checks to avoid navigating to `/dashboard` while `currentBarbershop` is `null`.

### 3. Onboarding Flow Success Handling
- **src/routes/onboarding/route.tsx**: 
  - Instead of a blind `window.location.href = '/'`, invalidate TanStack queries for `barbershop_users` and `barbershops`.
  - Wait for the context to refresh before navigating.
  - Handle potential delay between the RPC success and the data appearing in queries.

### 4. Dashboard Query Safety
- **src/routes/_authenticated/dashboard.tsx**:
  - Add explicit guards to queries to ensure they only run when `currentBarbershop.id` is available.
  - Add skeleton states or empty views for when data is missing but not yet crashed.

## Technical Details
- Use `queryClient.invalidateQueries` to force data refresh.
- Use optional chaining and nullish coalescing in all UI components accessing tenant data.
- Ensure the `/_authenticated` layout does not match `/auth` or `/onboarding` incorrectly.

## Verification Plan
1. **Reproduce**: Use Playwright to simulate a new user signup, completion of onboarding, and verify the redirect to the dashboard.
2. **Crash Check**: Monitor console for "Cannot read property 'id' of null" or similar errors.
3. **Loop Check**: Verify the URL doesn't accumulate `redirect` parameters.
4. **Build**: Run `npx tsc --noEmit` and `npm run build:dev` to ensure no regressions.
5. **F5 Test**: Refresh the dashboard and verify the tenant context persists correctly.
