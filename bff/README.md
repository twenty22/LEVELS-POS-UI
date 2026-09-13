# LEVELS POS BFF Scaffold

This server is a secure-integration scaffold for the Clover Flex plan.

## Run

```bash
npm run bff:dev
```

## Environment

The root `.env.example` includes:

- `LEVELS_BFF_MOCK_MODE=true`
- `LEVELS_BFF_PORT=8787`
- `LEVELS_BFF_HOST=127.0.0.1`
- Clover variables used when live mode is enabled

## Routes

- `GET /health`
- `GET /api/bootstrap`
- `POST /api/orders/upsert`
- `POST /api/payments/start`
- `POST /api/orders/finalize`

When `LEVELS_BFF_MOCK_MODE=false`, mutation routes return a `501` until live Clover REST handlers are implemented.
