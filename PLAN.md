# Banda – építési terv

> Munkanév: **Banda**. Baráti kör app: mag + csoportonként ki/bekapcsolható modulok.
> Egy fejlesztő (te + Claude Code), mobil-first PWA, Android elsődleges.

---

## 1. Funkciók

### Mag (mindig be van kapcsolva)
- **Csoport**: létrehozás, meghívó link, tagok, modulok ki/be kapcsolása
- **Programok**: közös entitás – ehhez kötődik a „Ki mit hoz”, a kassza, az album, az ötletbank
- **Feed**: minden modul eseménye egy idővonalon, reakciók, kommentek
- **Profil**: avatar, szín, XP, jelvények
- **Értesítések**: push + app-on belüli, típusonként állítható

### Modulok
| Modul | Röviden |
|---|---|
| ⚡ Ráérek most | „Ma este kapható vagyok: sör / futás / kaja / …” → aki ugyanarra ráér, push-t kap; „Én is” → programmá alakítható |
| 📅 Ki ér rá? | Következő 6 hét, mindenki jelöli: szabad / talán / foglalt → hőtérkép, legjobb napok, egy kattintással program |
| 💡 Ötletbank | Programötlet bedobása, swipe (benne / passz), küszöb felett automatikusan tervezett program |
| 🧺 Ki mit hoz | Programhoz kötött lista két szekcióval: **fogyóanyag** (kaja, pia) és **felszerelés** (sátor, főző) – ki vállalja, mennyit, megvan-e |
| 💸 Kassza | Kiadások (egyenlő / pontos / arányos osztás), egyenlegek, „Nullázás” = minimális utalások listája |
| 🤝 Fogadás | „Fogadjunk, hogy…” – tét (pl. egy kör), határidő, oldalak, eldöntés szavazással; vesztes tétje mehet a kasszába |
| 🎲 Döntéssegítő | Kerék, érme, kocka, számhúzás (min–max), sorrend-keverés, csapatsorsoló, „ki fizeti a kört”. Hiteles sorsolás: az eredményt a szerver húzza, a feedbe kerül |
| 📚 Listák | Előre kész ajánló listák (Film, Sorozat, Könyv, Étterem) + **saját listák**; ki ajánlotta, ki látta/próbálta, értékelés |
| 🏆 Kihívások | Heti kihívás, fotós bizonyíték, a többiek szavaznak érvényességről |
| 🥇 Liga & díjak | Szezonális XP-ranglista, havi szavazós díjak (saját kategóriák), év végi díjátadó |
| 📸 Emlékek | Programonkénti album, „Egy éve ma”, év végi Wrapped |
| 🔧 Kölcsönző | Ki mit tud odaadni, kinél van épp, mikorra kell vissza |

---

## 2. Stack (Vercel nélkül)

- **Frontend**: Vite + React + TypeScript (strict), React Router, TanStack Query
- **UI**: Tailwind CSS v4 + saját komponensek, Radix primitívek (dialog, popover, dropdown), `vaul` (bottom sheet), Lucide ikonok, `motion` (animáció)
- **PWA**: `vite-plugin-pwa` (manifest, service worker, offline shell)
- **Backend**: Supabase – Auth, Postgres + RLS, Storage, Realtime, Edge Functions (push, időzített jobok)
- **Hosting**: Cloudflare Pages (statikus build, ingyenes). Nincs saját szerver.

Tradeoff: nincs SSR → linkelőnézet (og:image) meghívó linkeknél csak statikus. Zárt appnál ez nem gond.

---

## 3. Architektúra

### Modul-rendszer
```
src/
  app/         router, providerek, layout, alsó tab bar
  core/        auth, groups, programs, feed, profiles, notifications, xp
  modules/
    <id>/
      manifest.ts     id, név, ikon, route-ok, feed-renderelők, XP-szabályok, program-szekció
      routes.tsx
      api.ts          Supabase hívások + TanStack Query hookok
      components/
  ui/          design-rendszer komponensek
  lib/         supabase kliens, utilok
supabase/
  migrations/  0001_core.sql, 0002_available.sql, …
  functions/   send-push, daily-jobs
```

Szabályok:
- Modul csak `core`-t és `ui`-t importálhat, másik modult soha.
- Modulok `emitActivity()`-vel jeleznek → `activity` tábla → feed + XP (trigger).
- Programhoz kötődő modul `programSection`-t ad a manifestben → megjelenik a program oldalán.
- Kikapcsolt modul (`group_modules.enabled = false`) route-jai, tabjai, feed-elemei rejtve.

### Adatmodell – mag
| Tábla | Mezők (fő) |
|---|---|
| `profiles` | id (= auth.uid), display_name, avatar_url, color |
| `groups` | id, name, invite_code, created_by |
| `group_members` | group_id, user_id, role (owner/member), joined_at |
| `group_modules` | group_id, module_id, enabled, settings jsonb |
| `programs` | id, group_id, title, starts_at, ends_at, location, status (idea/planned/done/cancelled), created_by |
| `program_attendees` | program_id, user_id, status (going/maybe/no) |
| `activity` | id, group_id, actor_id, module_id, type, ref_id, payload jsonb, created_at |
| `reactions`, `comments` | activity_id, user_id, … |
| `xp_ledger` | user_id, group_id, activity_id, points (triggerből) |
| `notifications` | user_id, group_id, type, payload, read_at |
| `push_subscriptions` | user_id, endpoint, p256dh, auth |
| `notification_prefs` | user_id, type, enabled |

RLS mindenhol: `is_group_member(group_id)` SQL függvény.

### Adatmodell – modulok (vázlat)
- **available**: `availability_pings` (group_id, user_id, tag, until, note), `ping_joins`
- **calendar**: `free_days` (group_id, user_id, date, state)
- **ideas**: `programs.status = 'idea'` + `idea_votes` (program_id, user_id, vote)
- **bring**: `bring_items` (program_id, kind consumable/gear, name, qty, claimed_by, done)
- **money**: `expenses`, `expense_splits`, `settlements` + `balances` view; pénz integer forintban, `currency` mező
- **bets**: `bets`, `bet_sides`, `bet_votes`
- **decide**: `draws` (group_id, kind, options jsonb, result jsonb, created_by) – eredmény `draw()` SQL függvényből
- **lists**: `lists` (group_id, title, kind preset/custom, icon), `list_items` (title, url, note, added_by, meta), `list_marks` (item_id, user_id, state, rating)
- **challenges**: `challenges`, `submissions`, `submission_votes`
- **league**: `seasons`, `award_categories`, `award_votes`
- **memories**: `photos` (program_id, path, taken_at, uploaded_by)
- **lending**: `items`, `loans`

---

## 4. UI-irány

Részletes szabályok: `CLAUDE.md` → Design-rendszer. Lényeg:
- **Tinta + papír + egy erős kiemelőszín** (paradicsom-narancs). Meleg, kicsit szerkesztőségi, kicsit játékos.
- Bricolage Grotesque címekhez és számokhoz, Manrope a UI-hoz.
- Vonalak árnyék helyett, pill gombok, bottom sheetek, alsó tab bar középső „+” gombbal.
- Játékos pillanatok csak ott, ahol értelme van: kerék pörgetés, kihívás teljesítés, Wrapped.

### Navigáció
Alsó tab bar: **Feed · Programok · ＋ · Modulok · Profil**
„＋” → bottom sheet gyors akciókkal: Ráérek most, Új kiadás, Sorsolás, Új program, Ötlet.

### Kulcsképernyők
1. Feed (felül „Ma ráérnek” sáv avatárokkal)
2. Program oldal (időpont, résztvevők, Ki mit hoz, kassza, album – modul-szekciókból)
3. Ki ér rá? hőtérkép
4. Kassza egyenlegek + Nullázás
5. Döntéssegítő (teljes képernyős kerék)
6. Listák
7. Csoport beállítások / modulok kapcsolói

---

## 5. Fázisok

Minden fázis végén: `npm run typecheck && npm run lint && npm run build` zöld, deploy Cloudflare Pagesre, kipróbálás két telefonon.

### 0. Alapok
- Vite + TS + Tailwind, design tokenek, fontok, PWA manifest/ikon
- Supabase projekt, Google + magic link login
- Cloudflare Pages deploy GitHubról
- `/dev/ui` oldal: minden UI komponens egy helyen (Button, Card, Sheet, Avatar, Input, ListRow, Tabs, EmptyState, Toast)

✅ Siker: telefonra telepíthető, belépés megy, `/dev/ui` jól néz ki világos és sötét módban.

### 1. Mag
- Csoport létrehozás, meghívó link, tagok, modul-kapcsolók
- Programok (létrehozás, részvétel)
- Feed realtime-mal, reakciók, kommentek
- Profil (név, avatar, szín)

✅ Siker: 2 user, 2 telefon; az egyik programot hoz létre → a másiknál 2 mp-en belül megjelenik a feedben.

### 2. Értesítések
- Push feliratkozás, `send-push` Edge Function (VAPID), app-on belüli értesítéslista, beállítások

✅ Siker: lezárt Androidra megérkezik a push. ⚠️ Kockázat: a `web-push` könyvtár Deno alatt – ezt a fázis elején próbáld ki, ha nem megy, alternatív implementáció.

### 3. Ráérek most + Ki ér rá?
✅ Siker: A ráér „sör” címkével → B push-t kap → „Én is” → program jön létre mindkettőjükkel. Hőtérképen a legjobb nap kiemelve, onnan program indítható.

### 4. Ki mit hoz (fogyóanyag + felszerelés)
✅ Siker: programhoz tétel felvétele, vállalás, kipipálás realtime frissül a másik telefonon.

### 5. Kassza
- Kiadás felvétele (programhoz köthető), osztási módok, egyenlegek, Nullázás (minimális utalás algoritmus, unit tesztekkel)

✅ Siker: 3 fős tesztadaton az egyenlegek összege 0, a Nullázás utalásai után mindenki 0-n áll.

### 6. Döntéssegítő
✅ Siker: mind a 7 mód működik; a megosztott sorsolás eredménye szerveroldali, a feedben ugyanaz látszik, mint az animáció végén.

### 7. Listák / Ajánló
✅ Siker: preset listák + saját lista, tétel hozzáadás, „láttam/kipróbáltam” + értékelés.

### 8. Ötletbank
✅ Siker: küszöb feletti like → automatikusan tervezett program + értesítés.

### 9. Játék: XP, liga, kihívások, díjak, fogadás, jelvények
✅ Siker: XP tranzakciók triggerből, ranglista helyes; kihívás szavazás után érvényes/érvénytelen; fogadás lezárható, tét a kasszába kerülhet.

### 10. Emlékek
- Album programonként (kliensoldali tömörítés: max 1600 px, WebP), „Egy éve ma” napi job, Wrapped (december, story-szerű képernyők)

✅ Siker: fotó feltöltés < 500 KB/kép; „Egy éve ma” teszt-dátummal megjelenik; Wrapped számai egyeznek az SQL-lekérdezéssel.

### 11. Kölcsönző
✅ Siker: tárgy felvétele, kölcsönkérés, visszaadás, lejárt határidőre emlékeztető.

---

## 6. Kockázatok, tradeoffok
- **Supabase ingyenes szint**: inaktív projekt szüneteltetődhet, Storage limit → fotótömörítés kötelező. Ellenőrizd az aktuális limiteket induláskor.
- **iOS push** csak telepített PWA-nál működik – Androidon nincs gond.
- **Realtime**: csak a feedre és az épp nyitott program oldalára iratkozz fel, ne mindenre.
- **Pénz**: egyenleg számítás SQL view-ban, nem kliensen; integer forint.
- **Csalásmentes sorsolás**: random csak szerveren.

## 7. Nyitott kérdések
- Végleges név
- Login: Google + magic link elég?
- Csak HUF, vagy több pénznem (külföldi utakhoz)?
