# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server at http://localhost:3000
npm run build    # production build (type-checks via next build)
npm run start    # serve the production build
```

There are no test or lint scripts configured. TypeScript type-checking runs as part of `next build`.

## Architecture

This is a Next.js 14 (App Router) single-page AI chat app deployed to Vercel. The entire product is three meaningful files:

| File | Purpose |
|------|---------|
| `app/page.tsx` | Full client-side chat UI (`'use client'`) — state, modals, Supabase auth, all rendering |
| `app/api/chat/route.ts` | POST handler that forwards messages to Google Gemini 2.0 Flash and returns the response |
| `lib/supabase.ts` | Supabase singleton client (reads env vars with placeholder fallbacks) |

### Request flow

1. User types → `sendMessage()` in `page.tsx` POSTs to `/api/chat` with the full message history and the saved `dogProfile` object.
2. `route.ts` builds a Gemini request: a fixed `SYSTEM_PROMPT` plus an optional dog-profile appendix injected at the end of the system instruction when a profile is present.
3. Gemini response is returned as `{ message: string }`.
4. If the user is authenticated, both the user message and assistant reply are inserted into the `chat_messages` Supabase table.

### Auth & free-tier gating

- Unauthenticated users get **20 free questions** tracked in `localStorage` (`csd_question_count`).
- Auth is Supabase magic-link (OTP) only — no password flow.
- After sign-in, the dog profile is loaded from the `dog_profiles` table and merged into `localStorage`.

### Supabase schema (inferred)

```sql
-- dog_profiles: one row per user
user_id, dog_name, breed, age, diet, health_issues, updated_at
-- unique on user_id; upserted via onConflict: 'user_id'

-- chat_messages: append-only log
user_id, session_id, role ('user'|'assistant'), content
```

### Styling conventions

Tailwind is installed but almost all styles are **inline `style` props** on JSX elements. The primary accent color is `#22c55e` (green-500). Dark background palette: `#0a0a14` (page), `#0f1623` (header/footer), `#111827` (cards), `#1f2937` (inputs). Only animations (`.dot-1/2/3` pulse) live in `globals.css`.

## Environment variables

| Variable | Where used |
|----------|-----------|
| `GEMINI_KEY` | Server-only — Gemini API key in `route.ts` |
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server — Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server — Supabase anon key |

Copy these to `.env.local` for local development. The Supabase client falls back to placeholder strings if vars are missing (won't crash, but all DB/auth calls will fail silently).

## Notes

- `app.json` is an Expo config remnant; there is no React Native code in the repo.
- The `@/*` path alias maps to the repo root (`tsconfig.json` `paths`).
- `strict: true` TypeScript — all new code must satisfy strict mode.
