# Security Checklist

## API and Input Security

- [ ] Zod validation added for mutable API payloads.
- [ ] `design_state` schema enforces max 500 nodes.
- [ ] SVG path payload sanitization blocks XXE/script vectors.
- [ ] Webhook signatures verified (Cashfree + Razorpay).
- [ ] Idempotency stored for webhook replay protection.

## Transport and Headers

- [ ] TLS 1.3 enabled on Nginx.
- [ ] HSTS enabled with preload.
- [ ] `X-Frame-Options: DENY`.
- [ ] `X-Content-Type-Options: nosniff`.
- [ ] CSP restricts inline scripts and third-party origins.

## Access and Rate Controls

- [ ] Strict CORS to production frontend origin only.
- [ ] Rate limit 100 req/min per IP on general API.
- [ ] Rate limit 10 req/min per IP on auth routes.
- [ ] SMS throttle max 1 message per 5 minutes per order.

## Data Protection

- [ ] Service-role keys stored only in server-side env vars.
- [ ] PII encrypted in transit and masked in logs.
- [ ] Customer uploads purged 30 days after delivery.
- [ ] Daily backup enabled with 7-day retention.

## Operations

- [ ] Worker/Inngest health checks monitored.
- [ ] Queue depth alert checks scheduled.
- [ ] Incident runbook documented for payment webhook failures.
- [ ] Secrets rotation schedule defined.
