# Plan: Fix Hydration Error and Clean up Settings

Fix invalid HTML nesting (`<div>` inside `<p>`) in the configurations route that causes hydration errors. Also remove redundant debug logs and update the instruction block in the home route.

## User Review Required

> [!IMPORTANT]
> None. This is a technical fix for HTML validity and console noise.

## Proposed Changes

### Configuration Route (`src/routes/_authenticated/configuracoes/route.tsx`)
- Change the parent element of the PWA status from `<p>` to `<div>` to allow `<div>` (status dot) as a child.
- Audit file for other invalid nesting (none found in initial read, but will double-check `<a><a>` or `<button><button>`).

### Barbearia Hook (`src/hooks/useBarbearia.ts`)
- Remove debug `console.log` statements from `useBarbearia` if present (checked and found `console.error` in mutations, which are standard, but will check for repetitive `console.log`).

### Home Route (`src/routes/index.tsx`)
- Update the instruction block to the version requested by the user.

## Technical Details
- React Hydration mismatch occurs when the server-rendered HTML structure is invalid (like `<div>` in `<p>`), causing the browser to auto-correct the DOM before hydration.
- The fix involves using `<div>` or `<span>` for semantic correctness and valid nesting.
- `useBarbearia` check: Remove unnecessary logs to clean up the console.

## Verification Plan

### Automated Tests
- Run `lovable-exec build` to ensure no regression in build process.
- Run `tsgo` for type checking.
- Use Playwright to:
  1. Verify `/configuracoes` page loads without "div cannot be a descendant of p" console error.
  2. Test updating name, location (city), and logo.

### Manual Verification
- Check browser console for hydration warnings.
- Confirm logo upload and removal works.
