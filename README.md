# LEVELS-POS-UI

POS-focused React UI scaffold for a fast-tap bar/dispensary workflow with Clover integration placeholders.

## Goal

Build a cashier-first UI where the most-available items are easiest to tap, cart state is always visible, and handoff to Clover tender is the natural final step.

## Local setup

```bash
npm install
npm run dev
```

## Clover scaffolding included

- Environment placeholders for Clover API key, merchant ID, and environment.
- `VITE_CLOVER_MOCK_MODE=true` default so UI can be exercised before credentials exist.
- Initial POS shell with:
  - quick-tap favorites sorted by stock
  - category filters
  - cart controls with quantity increment/decrement
  - ticket totals and checkout handoff button

## Next integration steps once credentials are available

1. Create Clover dev app and capture app id + secret.
2. Set up OAuth redirect/callback URLs for local and deployed UI.
3. Fill `.env` from `.env.example`.
4. Replace static `menuItems` data in `src/App.tsx` with Clover catalog APIs.
5. Wire checkout action to Clover tender/order APIs and error states.

## Scripts

- `npm run dev` – local Vite server
- `npm run build` – type-check + production build
- `npm run lint` – oxlint
- `npm run preview` – serve production build locally
