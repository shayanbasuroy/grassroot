# GrassRoot

Hyperlocal pooled condo meal kit and guided cooking web application built for Malaysian condominium communities (Bandar Sunway & Subang Jaya).

## Features

- **Cook Discovery (`/`):** Free appliance and cuisine filtered beginner halal recipe library plus weekly pooled meal kits with live community demand voting.
- **Interactive Recipe & Hands Free Cook Along (`/recipe/[slug]`, `/cook/[slug]`):** Serving scaler (`1 pax · 2 pax · 4 pax`), Screen Wake Lock, Web Speech voice commands, and floating Live Activity countdown timers.
- **Weekly Box Builder & Pickup Pass (`/box`, `/timers`):** Custom Sunday box builder with FPX / DuitNow QR checkout, QR Pickup Pass, and renewal or pause controls.
- **Operations Portals (`/captain`, `/admin`):** Building Captain QR handover scanner and Admin Friday 8:00 PM raw weight Supplier PO CSV exporter.

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production Build & Lint

```bash
npm run lint
npm run build
```
