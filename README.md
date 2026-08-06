# SpecialCar Points

Find the nearest Special Car point-of-sale across Saudi Arabia — browse by region or on the map, or locate yourself to sort by distance.

## Tech Stack

- **Framework:** Next.js 14.2 (App Router + TypeScript)
- **UI Components:** shadcn/ui (Radix UI + Tailwind CSS)
- **Styling:** Tailwind CSS 3 with custom design tokens (`--primary-*`, `--accent-*`, `--neutral-*`, …)
- **Database:** MongoDB (memory-mongo for dev, `lib/mongodb.ts`)
- **Session auth:** iron-session
- **Maps:** Leaflet + react-leaflet
- **Validation:** Zod

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

| Command        | Description                  |
| -------------- | ---------------------------- |
| `npm run dev`  | Start the dev server         |
| `npm run build`| Create a production build    |
| `npm run start`| Run the production server    |
| `npm run seed` | Seed the database            |
| `npm run lint` | Run ESLint                   |

## Project Structure

```
app/          Next.js App Router pages & layouts
components/
  ui/         shadcn/ui primitives
  public/     public-facing components (Header, MapView, EntryCard, …)
  admin/      admin-dashboard components
lib/          data, db, auth & validation helpers
```

## Design System

Design tokens live in `app/globals.css`. shadcn/ui semantic variables (`--primary`, `--card`, `--border`, …) are mapped onto the existing SpecialCar tokens so the UI stays brand-consistent (see `docs/shadcn-migration-summary.md`).