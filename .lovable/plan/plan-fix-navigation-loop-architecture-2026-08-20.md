# Plan - Fix Navigation Loop Architecture

Definitively resolve the navigation loop between `/auth`, `/onboarding`, and `/` by centralizing access control and removing race conditions in state propagation.

## User Review Required
> [!IMPORTANT]
> This plan changes the core navigation logic. While it aims for stability, it will replace existing manual `useEffect` redirects with a single centralized guard.

## Proposed Changes

### 1. Refactor Providers
- **`AuthProvider`**: Remove any logic that might trigger navigation. Ensure `isLoading` is strictly handled during auth state changes.
- **`BarbershopProvider`**: Ensure it handles the "no membership" case gracefully (loading finished, but data is null) without throwing or navigating.

### 2. Centralize Navigation Logic
- Create a new hook `useAccessState` in `src/hooks/useAccessState.ts` that consolidates `authLoading`, `shopLoading`, `session`, and `currentBarbershop` into a deterministic state:
  - `AUTH_LOADING`
  - `UNAUTHENTICATED`
  - `AUTHENTICATED_NO_BARBERSHOP`
  - `AUTHENTICATED_WITH_BARBERSHOP`

### 3. Implement Centralized Guard
- Modify `src/routes/_authenticated/route.tsx` to use `useAccessState` and handle redirects for all administrative routes.
- Modify `src/routes/auth.tsx` and `src/routes/onboarding/route.tsx` to use the same logic, ensuring they only render their content when the state is appropriate.

### 4. Optimize Onboarding Flow
- In `src/routes/onboarding/route.tsx`, after `create_barbershop_onboarding` success:
  - Invalidate TanStack Query caches related to barbershops and memberships.
  - Await a full refresh of the `BarbershopContext`.
  - Navigate to `/` only after the state is confirmed to be `AUTHENTICATED_WITH_BARBERSHOP`.

### 5. Add Debug Logging
- Add temporary `[ACCESS]` console logs to track state transitions and identify the source of any unexpected redirects.

## Technical Details
- **Deterministic State Logic**:
  ```typescript
  if (authLoading || (isAuthenticated && shopLoading)) return 'LOADING';
  if (!isAuthenticated) return 'UNAUTHENTICATED';
  if (!currentBarbershop) return 'AUTHENTICATED_NO_BARBERSHOP';
  return 'AUTHENTICATED_WITH_BARBERSHOP';
  ```
- **Auditing**: Remove `useEffect` based redirects from `AuthPage` and `BarbershopProvider`.
- **Atomic Navigation**: Replace manual `setTimeout` with `await refresh()` and query invalidation.

## Verification Plan
1. **Manual Testing**:
   - New user signup -> verify it stays on `/onboarding`.
   - Complete onboarding -> verify it goes to `/` once and stays there.
   - F5 on dashboard -> verify no redirect during loading.
   - Logout/Login -> verify correct routing.
2. **Automated Verification**:
   - Run Playwright script to observe URL transitions during signup and onboarding flows.
   - Check build and type safety (`npx tsc --noEmit && npm run build:dev`).
