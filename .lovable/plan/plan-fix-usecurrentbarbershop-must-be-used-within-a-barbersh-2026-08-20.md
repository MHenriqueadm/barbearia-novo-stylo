# Plan - Fix "useCurrentBarbershop must be used within a BarbershopProvider"

Correct the architecture to ensure `/auth` does not depend on a tenant context, and fix the onboarding flow to correctly handle the transition from no-tenant to tenant-active state.

## Proposed Changes

### 1. Remove Tenant Dependency from `/auth`
- **File:** `src/routes/auth.tsx`
- **Action:** 
    - Remove `useBarbershopSettings` hook call.
    - Remove logic that renders barbershop name or logo based on `settings`.
    - Use neutral branding (RESTYLE) for the login page.
    - Ensure it works without any active session or barbershop context.

### 2. BarbershopContext Robustness
- **File:** `src/contexts/BarbershopContext.tsx`
- **Action:** 
    - Ensure `loadBarbershop` handles the "no membership" case gracefully without throwing errors.
    - Keep it returning `null` when no tenant is found, which is valid for new users.

### 3. Root Layout & Providers Architecture
- **File:** `src/routes/__root.tsx`
- **Action:** 
    - Verify `AuthProvider` wraps `BarbershopProvider`.
    - `BarbershopProvider` is already global, but children (like `/auth`) must not call hooks that `throw` if the context is not "ready" (though since it's at root, it's always provided). The issue is `useBarbershopSettings` requiring a `currentBarbershop.id`.

### 4. Onboarding Success Flow
- **File:** `src/routes/onboarding/route.tsx`
- **Action:** 
    - Ensure it uses the `refresh()` from `BarbershopContext` correctly.
    - Add logic to verify if the user already has a barbershop on mount and redirect to dashboard if so (redundant check for safety).

### 5. Hook Safety
- **File:** `src/hooks/useBarbearia.ts`
- **Action:** 
    - Make `useBarbershopSettings` safer or ensure it's not called when `currentBarbershop` is null.

## Technical Details

- **Architecture:** 
    ```text
    Root (QueryClient -> AuthProvider -> BarbershopProvider)
    ├── /auth (Neutral, no useCurrentBarbershop data usage)
    ├── /onboarding (Inside BarbershopProvider, currentBarbershop is null initially)
    └── /_authenticated (Admin routes, requires currentBarbershop)
    ```
- **Validation:** 
    - `npx tsc --noEmit`
    - `npm run build:dev`
    - Manual test: Logout -> Access `/auth`.
    - Manual test: New user -> `/onboarding` -> Complete -> `/dashboard`.
