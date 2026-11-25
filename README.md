# Banda

Baráti kör PWA. Terv: `PLAN.md`, szabályok: `CLAUDE.md`.

```bash
npm install
npm run dev        # http://localhost:5173/banda/, UI-katalógus: /banda/dev/ui
npm run typecheck && npm run lint && npm run build
```

## Deploy
GitHub Pages, `.github/workflows/deploy.yml` minden pushra: https://botondjani.github.io/banda/
A Supabase publikus kulcsok a `.env`-ben vannak (publishable, commitolható).

## Supabase Auth
Authentication → URL Configuration: Site URL = `https://botondjani.github.io/banda/`,
Redirect URLs: `https://botondjani.github.io/banda/**`, `http://localhost:5173/banda/**`.
