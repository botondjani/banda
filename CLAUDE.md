# Banda – baráti kör PWA

Mobil-first PWA baráti köröknek: mag + csoportonként ki/bekapcsolható modulok.
Teljes terv és fázisok: `PLAN.md`. Mindig az aktuális fázison dolgozz, ne előre.

## Stack
- Vite + React + TypeScript (strict), React Router, TanStack Query
- Tailwind CSS v4, Radix primitívek, `vaul` (bottom sheet), Lucide ikonok, `motion`
- `vite-plugin-pwa`
- Supabase: Auth, Postgres + RLS, Storage, Realtime, Edge Functions (Deno)
- Hosting: GitHub Pages (statikus, `/banda/` base path), GitHub Actions deploy. Nincs saját szerver.

## Mappaszerkezet
```
src/app/       router, providerek, layout, tab bar
src/core/      auth, groups, programs, feed, profiles, notifications, xp
src/modules/<id>/  manifest.ts, routes.tsx, api.ts, components/
src/ui/        design-rendszer komponensek
src/lib/       supabase kliens, utilok
supabase/migrations/  NNNN_<név>.sql
supabase/functions/
```

## Szabályok
- Minimális kód. Nincs spekulatív absztrakció, nincs „később jól jön” kód.
- Modul csak `core`-t és `ui`-t importálhat, másik modult soha.
- Modul eseményt `emitActivity()`-vel küld; feed és XP ebből él.
- Minden modul-táblán `group_id` + RLS `is_group_member(group_id)`.
- Minden új modul saját migrációs fájl.
- Pénz, XP, sorsolás eredménye: szerveroldalon (SQL view / függvény), nem kliensen. Pénz integer forint.
- UI szöveg magyarul, kód (változók, táblák, fájlok) angolul.
- Adatlekérés a modul `api.ts`-ében, TanStack Query hookokkal.
- Ha valami nem egyértelmű, kérdezz, ne találgass.

## Ellenőrzés (minden lépés után)
1. `npm run typecheck && npm run lint && npm run build`
2. UI változásnál: nézd meg 390 px széles viewporton, világos és sötét módban.
3. Fázis végén a `PLAN.md` siker-kritériumát ellenőrizd ténylegesen.

## Design-rendszer – ne legyen AI-slop
Irány: **tinta + papír + egy erős kiemelőszín**. Meleg, kicsit szerkesztőségi, kicsit játékos.

### Betűk (self-hosted, `@fontsource-variable`)
- **Bricolage Grotesque** – címek, nagy számok (egyenleg, XP, pontszám), `tabular-nums`
- **Manrope** – minden UI szöveg

### Színek (CSS változók, light / dark)
| Token | Light | Dark | Használat |
|---|---|---|---|
| `--paper` | #F5F1EA | #141311 | háttér |
| `--surface` | #FFFFFF | #1E1C19 | kártya, sheet |
| `--ink` | #191714 | #F2EEE7 | fő szöveg |
| `--muted` | #6E675E | #9A9287 | másodlagos szöveg |
| `--line` | #E4DDD2 | #2E2B27 | keretek, elválasztók |
| `--accent` | #FF5B2E | #FF6B42 | CSAK elsődleges akció, aktív állapot |
| `--positive` | #2F9E62 | #3DB876 | pénz +, érvényes |
| `--negative` | #D6453D | #E5594F | pénz −, érvénytelen |

Felhasználói színek (avatar háttér, 8 db, tompított): minden user kap egyet, ez azonosítja a feedben, grafikonokon.

### Forma, tér
- Kártya: 14px radius, 1px `--line` keret, **árnyék nélkül**. Árnyék csak lebegő elemen (sheet, ＋ gomb, toast).
- Gombok: pill (999px), min. 44px magas. Elsődleges: `--accent` háttér; másodlagos: keretes.
- 4-es térköz-skála, képernyő oldalmargó 20px, bőkezű függőleges tér.
- Tartalom balra igazítva; középre csak üres állapot és teljes képernyős pillanat (kerék, Wrapped).

### Komponensek, minták
- Alsó tab bar: Feed · Programok · ＋ · Modulok · Profil. A „＋” → gyorsakció bottom sheet.
- Űrlapok mobilon bottom sheetben, nem modalban.
- Lista-sorok (avatar · cím · meta · jobbra érték) a fő építőelem, nem kártyahalmok.
- Üres állapot: egy rövid, laza mondat + egy gomb. Nincs illusztráció.
- Ikonok: Lucide, 1.75 stroke, 20px. Emoji csak felhasználói tartalomban és reakciókban.
- Mozgás: 150–250 ms ease-out; spring/konfetti csak kerék, kihívás teljesítés, Wrapped. `prefers-reduced-motion` tisztelete.
- Szövegek: tegező, rövid, kicsit humoros („Senki nem hoz szenet. Megint.”), nem marketing.

### TILOS
- lila–kék gradiens, glassmorphism, neon glow
- árnyék minden kártyán, kártya a kártyában
- Inter / rendszer default font
- emoji ikonként a navigációban vagy címekben
- „🚀 Welcome to…”, „Unlock your potential” típusú szöveg
- minden elem középre igazítva, felesleges badge-ek, 3 különböző gombstílus egy képernyőn

### UI ellenőrzés
Minden új komponens kerüljön fel a `/dev/ui` oldalra (csak dev buildben elérhető), és ott nézd meg világos és sötét módban, mielőtt használod.
