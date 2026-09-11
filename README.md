# Rental Desk

**Rental Desk** is a polished, mobile-first static web demo of a South African **small landlord case manager**.

Sample portfolio: **Botha Rentals · Bloemfontein**. Demo / sample ZAR data only. **NOT** legal or financial advice.

Shared DNA with [Life Desk](https://esteprinsloo101-web.github.io/life-desk/) and [Trade Desk](https://esteprinsloo101-web.github.io/trade-desk/): the app **reminds, chases, prepares, closes**; human **Approves** deposit release / deductions / Tribunal-oriented packs. Installable as a **PWA** (Add to Home Screen) with an offline-ish shell cache.

## Live URL

**https://esteprinsloo101-web.github.io/rental-desk/**

(GitHub Pages from `main`; allow a minute after push for deploy.)

## Modules

| Module | Role |
|--------|------|
| **Today** | Due processes · case loop · reminders · occupancy / arrears KPIs · history |
| **Units** | Properties / units portfolio |
| **Cases** | Rent · exit/handover · snag · deposit cases |
| **Money** | Rent ledger · deposits held |
| **Tenants / leases** | Active leases · ending soon |
| **Snags / repairs** | Open tickets · contractor chase |
| **Docs** | Leases · evidence packs |
| **Science Desk** | Weekly improve tips (methods + limits) |
| **Settings** | Modules · quiet hours · notifications · export/import |

## Process types (ProcessRunner — not checklists)

- **Rent due** — review → chase (account links) → confirm received (unlocks handover when exit case open)
- **Handover evidence** — prep → **photo slots** → notes → close (unlocks snag chase / deposit)
- **Snag close** — review → chase contractor → verify closed (unlocks deposit release)
- **Deposit close** — calc → **Approve deductions** → **Approve deposit release** → refund

Click outstanding → wizard → Done → set **next due** → item returns to Today when due approaches. Completing a stage **ensures the next ProcessRunner** in the rent → handover → snags → deposit loop.

## PWA (install + offline shell)

1. Open the live URL or local server in Chrome / Edge / Safari.
2. Use **Install** / **Add to Home Screen** when the banner appears (or browser menu).
3. On iOS Safari: Share → **Add to Home Screen**.
4. The service worker caches the shell: `index.html`, `app.js`, `styles.css`, `manifest.webmanifest` (+ icons). Cache name: **`rental-desk-shell-v1`**. Offline use is **shell-only** — open the app once online first.

## Reminders v1

- **Today → Next reminders** shows the in-app queue for due / lead-window processes (tap to run the wizard).
- **Enable notifications** (or Settings → Request permission). If denied, the UI stays graceful — in-app queue still works.
- **Quiet hours** (default 21:00–07:00) are stored in `localStorage` with app state; alerts are skipped during quiet hours and fire times shift outside them.
- After you finish a process (**Done**), the next reminder is scheduled from the new **next due** (when permission is granted and the tab can run timers).

## Backup (export / import)

In **Settings → Backup**:

1. **Export JSON** — downloads app state (`rental-desk-v4` payload: units, cases, ledger, processes, history, modules, prefs).
2. **Import JSON** — pick a previous export to restore (round-trip). Invalid files toast an error and leave current data alone.

## Open locally

Plain static files. No build step. **Serve over http(s)** so the service worker and notifications can register.

```bash
# from this folder
python3 -m http.server 8772
# then open http://127.0.0.1:8772/
```

Files: `index.html` · `styles.css` · `app.js` · `manifest.webmanifest` · `service-worker.js` · `icons/` · `README.md`

Storage key: `rental-desk-v4`

## Verify (local)

1. `python3 -m http.server 8772` then open http://127.0.0.1:8772/
2. **Today** — confirm case loop (rent → handover → snags → deposit), due processes, reminders, occupancy/arrears KPIs.
3. Run **Rent** → finish → if exit unit, handover appears due; run **Handover** → snag unlocks; run **Snag** → deposit unlocks; run **Deposit** (**Approve deductions** + **Approve deposit release**).
4. **Settings** — quiet hours; request notifications; **Export JSON** then **Import JSON**.
5. DevTools → Application → Manifest + Service Worker (`rental-desk-shell-v1`); optional: go offline and confirm shell still loads.
6. Keep **Science Desk** + elderly UI (large type / 48px taps) from platform bar.
7. `curl -I https://esteprinsloo101-web.github.io/rental-desk/` after Pages deploy from `main`.

## Disclaimer

Demo / sample data only. **NOT** legal or financial advice. Rental Desk does **not** file at the Rental Housing Tribunal, draft leases, or move money for you. **You Approve** irreversible money steps (deductions, deposit release). Confirm real-world compliance yourself.

## Update 2026-09-11

Platform bar: Science Desk, elderly UI, location+purpose onboarding.

**feat/pwa-reminders-export:** PWA manifest + service worker shell cache (`rental-desk-shell-v1`), install affordance, reminders v1 (notifications + quiet hours + post-Done schedule), JSON export/import backup, stronger rent → handover → snags → deposit ProcessRunner loops with Approve on deposit release, Science Desk stub kept.
