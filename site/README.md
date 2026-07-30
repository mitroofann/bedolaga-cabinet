# Marketing site (bulkavpn.net)

Static landing / homepage for Bulka VPN — plain HTML + CSS + fonts + SVG, **no build
step**. Maintained in this repo alongside the cabinet, deployed separately to its own
domain.

## Quick start (recommended — Docker + automatic HTTPS)

```bash
cd site
cp .env.example .env      # set SITE_DOMAIN to your domain
docker compose up -d
```

That's it. Caddy serves this folder and obtains/renews the Let's Encrypt TLS
certificate automatically. Ports 80 and 443 must be free on the host, and the
domain's DNS A/AAAA record must already point at the server's IP (Caddy needs to
reach it to issue the certificate).

Update the site later by editing files here and running `docker compose restart`
(or just re-running `up -d` after `git pull`).

### Files

- `index.html` — the whole page (inline `<style>` + inline JS for reveal/FAQ/CTA).
- `assets/` — compiled `tailwind.css`, local Noto Sans woff2, SVG icons, OG images.
- `robots.txt`, `sitemap.xml`.
- `Caddyfile`, `docker-compose.yml`, `.env.example` — deploy (not served to visitors).

## Alternative — existing web server, no Docker

If you already run nginx/Caddy on the host, just point a vhost's web root at this
folder. Example nginx:

```nginx
server {
    listen 443 ssl http2;
    server_name bulkavpn.net;
    root /srv/site;                 # this folder
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
    location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }
}
```

The cabinet stays on its own (sub)domain — this site is independent and is not part
of the cabinet Docker image (`site/` is excluded via `.dockerignore` and Biome).

## CTA wiring to the cabinet

CTA links point to `https://cabinet.bulkavpn.net`:

- **Purchase CTAs** ("Купить VPN", "Попробовать за 10 ₽", "Выбрать тариф", "Выбрать",
  "Оформить подписку") → `/buy/main` — the public purchase funnel (no prior
  registration; the account is created after payment).
- **Login CTAs** ("Войти в ЛК", "Войти в аккаунт") → `/login`.

> **Required:** create a landing with slug `main` in the cabinet (Admin → Landings)
> with tariffs + payment methods. Until it exists, `/buy/main` returns "not found".
> To use a different slug, update the 7 `/buy/…` hrefs in `index.html`.
