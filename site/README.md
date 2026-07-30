# Marketing site (bulkavpn.net)

Static landing / homepage for Bulka VPN — plain HTML + CSS + fonts + SVG, **no build
step**. Maintained in this repo alongside the cabinet, deployed separately to its own
domain.

## Which option to use

> **Important:** only one process can listen on port 443. If a reverse proxy
> (Caddy/nginx/Traefik) already serves the cabinet on this server, it already owns
> 443 — do **not** also start `site/docker-compose.yml`, or the two fight over the
> port. Domains don't conflict (one proxy routes `bulkavpn.net` and
> `cabinet.bulkavpn.net` by name); only ports do.

- **A proxy already runs on this server** (typical — the cabinet is behind Caddy) →
  use **Option B** (add a block to that proxy). Skip the Docker command.
- **Nothing serves 443 on this box** (e.g. a dedicated host for the site) →
  use **Option A** below.

## Option A — standalone Docker + automatic HTTPS

Use only when ports 80/443 are free on the host.

```bash
cd site
cp .env.example .env      # set SITE_DOMAIN to your domain
docker compose up -d
```

Caddy serves this folder and obtains/renews the Let's Encrypt TLS certificate
automatically. The domain's DNS A/AAAA record must already point at the server's IP
(Caddy needs to reach it to issue the certificate).

Update later by editing files here and re-running `docker compose up -d` after
`git pull`.

## Option B — add to the existing proxy (shared server)

The cabinet's Caddy already holds 443. Add one site block to its Caddyfile instead
of starting a second proxy — copy the block from **`Caddyfile.snippet`**, adjust the
`root` path/domain, put the site files where that Caddy can read them (e.g.
`/srv/site` or a mounted volume), and reload Caddy. The cabinet block stays
untouched; both domains are served by the same process.

### Files

- `index.html` — the whole page (inline `<style>` + inline JS for reveal/FAQ/CTA).
- `assets/` — compiled `tailwind.css`, local Noto Sans woff2, SVG icons, OG images.
- `robots.txt`, `sitemap.xml`.
- `Caddyfile`, `docker-compose.yml`, `.env.example` — deploy (not served to visitors).

### nginx variant (Option B on nginx)

If the existing proxy is nginx, add a vhost pointing at this folder:

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
