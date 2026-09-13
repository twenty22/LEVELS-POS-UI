# LEVELS-POS-UI

Modern React UI mockup for a cashier-first LEVELS checkout experience built around Clover payment platform workflows.

## Goal

Show a modern, efficient payment command center where menu building, cart review, tender selection, terminal readiness, and Clover handoff are visible in one fast cashier workflow.

## Local setup

```bash
npm install
npm run dev
```

## Clover scaffolding included

- Environment placeholders for Clover API key, merchant ID, and environment.
- `VITE_CLOVER_MOCK_MODE=true` default so UI can be exercised before credentials exist.
- Clover-focused mockup with:
  - terminal readiness and live/mock mode status
  - shift performance cards for approval speed, throughput, and device health
  - category filters with large fast-tap catalog cards
  - persistent cart controls with quantity increment/decrement
  - tender selection for tap, chip, cash, and gift payments
  - itemized totals and checkout handoff button

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

## Integration design spec

- [design_spec.md](./design_spec.md) — Clover Flex integration architecture, device load/run lifecycle, and system interaction diagrams.
