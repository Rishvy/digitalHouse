# W2P Worker Service

Standalone asynchronous worker for:

- Headless design rendering at 300 DPI
- CMYK conversion fallback chain (Sharp -> Ghostscript ICC)
- Print-ready PDF assembly
- Automated preflight validation

## Scripts

- `npm run dev` - run worker locally
- `npm run build` - compile TypeScript
- `npm run start` - run compiled worker
- `npm run test` - run worker tests

## Endpoints

- `POST /jobs/pdf-generate`
- `POST /jobs/preflight-validate`
- `GET /health`
