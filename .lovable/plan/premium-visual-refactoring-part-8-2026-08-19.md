# Premium Visual Refactoring - Part 8

Implement a comprehensive visual and UX overhaul for the Admin Dashboard and Public Booking page, shifting from a generic layout to a premium, editorial design inspired by Linear/Vercel/Stripe.

## UI/UX Changes

### Admin Dashboard (`/`)
- **Editorial Header**: Sophisticated greeting ("Bom dia, Otávio") with date/summary subtext and a prominent "+ Novo agendamento" CTA.
- **Hero Summary**: A large, highlighted card for "Hoje na RESTYLE" showing the next appointment details and key metrics.
- **Metric Hierarchy**: Reorganize stats cards with varying sizes and micro-indicators (Revenue vs. Count).
- **Timeline Agenda**: Replace the list with a vertical daily timeline including duration indicators and status badges.
- **Quick Actions**: Premium-styled shortcut cards with icons and descriptions (Agendar, Cliente, Movimentação, Ajustes).
- **Sharing Card**: Dedicated card for the booking link with elegant URL display and copy/share actions.
- **Mobile Navigation**: Refined bottom navigation with backdrop blur and active states.

### Public Booking (`/agendar`)
- **App-like Experience**: Standalone layout optimized for Instagram bio visits.
- **Progress Stepper**: Elegant progress indicator (e.g., "Passo 3 de 5") with a slim progress bar.
- **Premium Cards**: Redesigned Service and Professional selection cards with subtle depth, touch feedback, and electric blue accents.
- **Date/Time Selection**: Horizontal scrollable date list and a clean grid for time slots.
- **Summary & Success**: High-contrast summary card before confirmation and a celebratory success screen with the confirmation code and WhatsApp integration.

### Global Design System
- **Layered Surfaces**: Deep black background (#000000) with graphite (Slate-900) and elevated slate (Slate-800) layers.
- **Accented Minimalism**: Electric blue (#2563EB) used strictly for focus and primary actions.
- **Typography**: Consistent use of Manrope for headers and metrics; Inter for body text.

## Technical Details

- **Tailwind v4 Refinement**: Update `src/styles.css` with semantic tokens for `surface`, `surface-hover`, and `accent`.
- **Component Refactoring**:
  - `AppLayout.tsx`: Update Sidebar and BottomNav for better spacing and elegance.
  - `src/routes/index.tsx`: Complete rewrite of the component body to implement the new layout.
  - `src/routes/agendar/route.tsx`: Update wizard steps and success screen styles.
- **Zero Logic Impact**: All data fetching, RPC calls, and business rules remain untouched.

## Verification Plan

- **Visual Check**: Inspect all responsive breakpoints (360px to Desktop).
- **Flow Validation**: Test the full booking wizard from service selection to confirmation.
- **Dashboard Integrity**: Ensure real-time stats (Revenue, Appointments) still calculate correctly.
- **Build**: Ensure `bun run build` passes with no regressions.
