# Banda

Baráti kör PWA. Terv: `PLAN.md`, szabályok: `CLAUDE.md`.

```bash
npm install
npm run dev        # http://localhost:5173, UI-katalógus: /dev/ui
npm run typecheck && npm run lint && npm run build
```

## Deploy – Cloudflare Pages (Git-integráció)
Build command: `npm run build` · Output: `dist` · Env: `NODE_VERSION=22`.
A Supabase publikus kulcsok a `.env`-ben vannak (publishable, commitolható).

## Supabase Auth beállítás
- Authentication → URL Configuration: Site URL = Pages domain; Redirect URLs: Pages domain + `http://localhost:5173`.
- Providers → Google: Google Cloud OAuth Client ID/Secret; a Google oldalon redirect URI:
  `https://zccnafkupundvovwyypk.supabase.co/auth/v1/callback`.
