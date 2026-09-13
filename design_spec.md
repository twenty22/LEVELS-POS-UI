# LEVELS Clover Flex Integration Design Spec

## 1) Purpose

Define how the LEVELS POS mockup becomes a production Clover Flex payment app, including:

- runtime architecture,
- Flex-specific device behavior,
- secure API boundaries,
- and how the app is loaded, launched, and operated on Clover Flex devices.

## 2) Scope

- Target hardware: **Clover Flex 1 (C401)** and **Clover Flex 4 (C403)**.
- Checkout categories: drinks and dispensary menu flows from Clover catalog.
- Employee attribution: ticket/payment actions tied to Clover employee IDs.
- Payments: native Clover card-present flow invoked from the host bridge.
- Tax behavior: no-sales-tax configuration for St. Croix merchant setup.

Out of initial scope:

- Flex Pocket-specific UX tuning,
- browser-only payment processing,
- direct Clover credentials in browser code.

## 3) System architecture (high level)

1. **React cashier UI** (this repository) provides ticket-building, item taps, and checkout controls.
2. **Android Clover Flex host app** loads the React app in WebView and exposes privileged bridge methods.
3. **LEVELS BFF** handles Clover REST traffic and keeps Clover secrets server-side.
4. **Clover Platform APIs + Clover payment app** execute order/payment/receipt operations.

Architecture diagram source and artifact:

- [flex-system-interactions.architecture.json](./docs/diagrams/flex-system-interactions.architecture.json)
- [flex-system-interactions.html](./docs/diagrams/flex-system-interactions.html)

## 4) How the app gets loaded and run on Flex devices

This is the required load/run lifecycle for Clover Flex:

1. **Build the React app**
   - Run `npm run build` in this repo to produce `dist/`.
2. **Package into Android host app**
   - Copy `dist/` into the Clover host app assets (primary strategy: local bundled assets).
3. **Sign and distribute host app**
   - Ship through the Clover app distribution path used by the merchant account.
4. **Launch from Clover launcher**
   - Cashier taps the LEVELS POS icon on the Flex device to open the host activity.
5. **Initialize bridge and capabilities**
   - Host resolves model/capabilities (`C401` vs `C403`) and starts bridge APIs.
6. **Load cashier UI in WebView**
   - Host loads local `index.html` from packaged assets.
7. **Bootstrap runtime session**
   - React requests bridge context + BFF bootstrap data (merchant/session/config).
8. **Run operational payment loop**
   - Cashier builds order -> React syncs order via BFF -> bridge invokes native Clover payment -> result returns to React -> closeout/receipt policy runs.
9. **Update strategy**
   - Host+UI updates are tied to app release cadence unless a signed remote-asset strategy is introduced later.

## 5) Core interaction contracts

- **Bridge contract**
  - `authenticateEmployee`
  - `getDeviceCapabilities`
  - `startPayment`
  - `setCustomerMode` (capability-gated)
  - `onPaymentResult`
- **BFF endpoints**
  - catalog items, employees, order create/update, payment reconciliation, receipt finalization
- **State machine**
  - `idle -> building_order -> payment_pending -> paid|failed|canceled`

Sequence diagram source and artifact:

- [flex-payment-roundtrip.sequence.json](./docs/diagrams/flex-payment-roundtrip.sequence.json)
- [flex-payment-roundtrip.html](./docs/diagrams/flex-payment-roundtrip.html)

## 6) Security and compliance boundaries

- Clover tokens and secrets are stored in BFF/server configuration only.
- React browser layer never receives Clover secret material.
- Payment authorization remains in native Clover payment flow.
- Idempotency keys are required for order/pay/refund mutation endpoints.

## 7) Device capability policy

Capabilities are detected at runtime and used to gate behavior:

- secure payments/touch features,
- customer mode and rotation support,
- bundled printer availability.

The UI must not assume rotation-only handoff patterns are available.

## 8) Validation and operations

- Validate order/payment synchronization on both C401 and C403.
- Validate receipt behavior with printer-available and fallback paths.
- Validate recovery behavior for cancel/timeout/offline/partial outcomes.
- Emit structured telemetry by `orderId`, `paymentId`, `employeeId`, and device identifiers.

## 9) Diagram workflow (Archify)

Render these docs artifacts with local Archify CLI:

```bash
node /home/carlos/Documents/git_repos/archify/archify/bin/archify.mjs validate architecture docs/diagrams/flex-system-interactions.architecture.json --quality showcase --json
node /home/carlos/Documents/git_repos/archify/archify/bin/archify.mjs deliver architecture docs/diagrams/flex-system-interactions.architecture.json docs/diagrams/flex-system-interactions.html --quality showcase --json

node /home/carlos/Documents/git_repos/archify/archify/bin/archify.mjs validate sequence docs/diagrams/flex-payment-roundtrip.sequence.json --quality showcase --json
node /home/carlos/Documents/git_repos/archify/archify/bin/archify.mjs deliver sequence docs/diagrams/flex-payment-roundtrip.sequence.json docs/diagrams/flex-payment-roundtrip.html --quality showcase --json
```

