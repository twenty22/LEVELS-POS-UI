# LEVELS-POS-UI

Modern React UI mockup for a cashier-first LEVELS checkout experience built around Clover payment platform workflows.

## Goal

Deliver a Clover Flex-first cashier experience where menu building, ticket attribution, payment handoff, and closeout happen in one fast operator workflow.

## Local setup (UI only)

```bash
npm install
npm run dev
```

## Local setup (UI + BFF scaffold)

```bash
npm install
npm run bff:dev
npm run dev
```

Default BFF URL for the UI is `http://127.0.0.1:8787` (`VITE_LEVELS_BFF_BASE`).

## Clover scaffolding implemented

- Environment placeholders for Clover API key, merchant ID, and environment.
- `VITE_CLOVER_MOCK_MODE=true` default so UI can be exercised before credentials exist.
- Typed integration contracts in `src/integration/contracts.ts`.
- Runtime client adapters:
  - mock client (`src/integration/mock-client.ts`)
  - HTTP BFF client (`src/integration/http-client.ts`)
  - Clover Flex bridge adapter (`src/integration/bridge.ts`)
- React UI wired to bootstrap, order upsert, payment start, and order finalize flows.
- BFF scaffold in `bff/server.mjs` with endpoints:
  - `GET /health`
  - `GET /api/bootstrap`
  - `POST /api/orders/upsert`
  - `POST /api/payments/start`
  - `POST /api/orders/finalize`

## Next integration steps once credentials are available

1. Implement live Clover REST calls in BFF (replace scaffold mock handlers).
2. Add Clover Flex Android host bridge (`getDeviceCapabilities`, `startPayment`) and bind to `window.CloverFlexBridge`.
3. Add employee authentication intent flow and connect selected bartender to verified Clover employee session.
4. Add idempotent retry handling and reconciliation for cancel/timeout/offline outcomes.
5. Execute C401 + C403 sandbox QA against the design spec flows.

## Scripts

- `npm run dev` – local Vite server
- `npm run bff:dev` – local BFF scaffold server
- `npm run build` – type-check + production build
- `npm run lint` – oxlint
- `npm run preview` – serve production build locally

## Integration design spec

- [design_spec.md](./design_spec.md) — Clover Flex integration architecture, device load/run lifecycle, and system interaction diagrams.
