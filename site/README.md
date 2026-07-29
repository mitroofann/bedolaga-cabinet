# Marketing site (bulkavpn.net)

Static landing / homepage for Bulka VPN. Plain HTML + CSS + fonts + SVG — **no build
step**. Maintained in this repo alongside the cabinet, but **deployed separately** to
its own domain (variant A).

## Contents

- `index.html` — the whole page (inline `<style>` + inline JS for reveal/FAQ/CTA).
- `assets/` — compiled `tailwind.css`, local Noto Sans woff2, SVG icons, OG images.
- `robots.txt`, `sitemap.xml`.

## Deploy

Point the marketing domain's web root at this folder (or copy its contents to the
server dir the proxy serves). Example nginx:

```nginx
server {
    listen 443 ssl http2;
    server_name bulkavpn.net;
    root /srv/site;            # contents of this folder
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
}
```

Or with Caddy:

```caddyfile
bulkavpn.net {
    root * /srv/site
    file_server
    encode gzip zstd
}
```

The cabinet stays on its own (sub)domain — this site is independent and does not ship
inside the cabinet build (`site/` is excluded via `.dockerignore` and Biome).

## Wiring to the cabinet

All CTA buttons ("Войти в ЛК", "Купить VPN", "Попробовать за 10 ₽") link to
`https://cabinet.bulkavpn.net/login`. If your cabinet lives on a different domain,
update those hrefs in `index.html` accordingly.
