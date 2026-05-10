# Virtual Pet Game

A Next.js + TypeScript virtual pet app where you adopt a pet, take care of its stats, chat with it, level it up, and unlock achievements.

## What the app does

- Create and care for a pet (`cat`, `dog`, `rabbit`, or `dragon`)
- Manage pet stats: **hunger, happiness, health, energy**
- Perform actions: **feed, play, exercise, rest**
- Gain XP, level up, and progress through evolution stages
- Chat with your pet through an AI-backed chat API
- Unlock achievements and earn coin rewards
- Persist data with **Prisma + SQLite**

## Tech stack

- Next.js 15 (App Router)
- React 19 + TypeScript
- Tailwind CSS + shadcn/ui
- Prisma ORM
- SQLite database

## Project structure

- `src/app/page.tsx` – main game UI and gameplay logic
- `src/app/api/pets` – create/list pets
- `src/app/api/pets/[id]` – get/update one pet
- `src/app/api/achievements` – seed/list achievements
- `src/app/api/achievements/unlock` – unlock achievement + reward coins
- `src/app/api/chat` – AI chat responses for pets
- `prisma/schema.prisma` – database schema
- `src/lib/db.ts` – Prisma client singleton

## Prerequisites

- Node.js 18+
- npm

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` in the project root:

```env
DATABASE_URL="file:./db/custom.db"
```

If your Prisma setup resolves paths differently in your environment, adjust the relative path accordingly.

3. Generate Prisma client and sync schema:

```bash
npm run db:generate
npm run db:push
```

4. Start development server:

```bash
npm run dev
```

5. Open:

- http://localhost:3000

## Available scripts

```bash
npm run dev        # start dev server on port 3000
npm run lint       # run Next.js lint
npm run build      # production build
npm run start      # run production server
npm run db:generate # generate Prisma client
npm run db:push     # sync schema to database (no migration files)
npm run db:migrate  # create/apply development migration
npm run db:reset    # reset database and reapply migrations
```

## API overview

- `POST /api/pets` – create pet
- `GET /api/pets` – list pets (defaults to generated default user)
- `GET /api/pets/:id` – get pet with recent conversations and achievements
- `PUT /api/pets/:id` – update pet stats/mood/progression
- `POST /api/achievements` – initialize default achievements
- `GET /api/achievements` – list all achievements
- `GET /api/achievements?petId=<id>` – list unlocked achievements for a pet
- `POST /api/achievements/unlock` – unlock achievement for pet
- `POST /api/chat` – send message and get pet reply + mood hint

## Notes

- Pet stats decay over time while playing.
- Current app metadata in `src/app/layout.tsx` is still scaffold-branded and can be updated separately.
