# India Deployment Guide

## Target Topology

- VPS 1 (Bangalore/Mumbai): Next.js + Nginx reverse proxy
- VPS 2: Managed Supabase (Postgres + storage)
- VPS 3: Worker + Inngest + Redis
- CDN: Cloudflare in front of Nginx

## Provisioning Steps

1. Copy `.env.production.example` to `.env.production` and set real secrets.
2. Configure DNS (`A` record) to Nginx host, then enable Cloudflare proxy.
3. Install Docker + Docker Compose plugin on target VPS.
4. Place TLS certs in `deploy/nginx/certs` (`fullchain.pem`, `privkey.pem`).
5. Start stack:
   - `docker compose -f docker-compose.prod.yml up -d --build`
6. Verify health:
   - Web: `https://your-domain.com`
   - Worker: `http://worker:4010/health` (from internal network)
   - Inngest: `http://inngest:8288/health` (internal network)

## Managed Supabase Notes

- Keep connection pooling enabled in Supabase project settings.
- Keep DB indexes on `orders.user_id`, `orders.status`, `order_items.order_id`.
- Rotate service role keys and webhook secrets quarterly.

## CI/CD

- GitHub Action at `.github/workflows/deploy.yml` runs tests/build, pushes images, SSH deploys.
- Ensure secrets are present in GitHub:
  - `DOCKER_REGISTRY`, `DOCKER_USERNAME`, `DOCKER_PASSWORD`
  - `PROD_HOST`, `PROD_USER`, `PROD_SSH_KEY`

## Backups

- Run `scripts/backup_supabase.sh` daily via cron.
- Keep 7-day retention in S3-compatible storage.

## Cost Optimization Notes

- Start with 2 vCPU web node and 4 vCPU worker node.
- Use Cloudflare cache rules for `/_next/static`.
- Scale worker independently during high render volume.
