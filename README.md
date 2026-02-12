# Academic Life

Academic Life is a desktop-first SaaS command centre for Masters and PhD students that combines project structure with scheduling.

## Stack
- Next.js App Router + TypeScript
- Supabase Auth + PostgreSQL (with RLS)
- Stripe subscriptions (7-day trial, single paid plan)
- FullCalendar drag-and-drop planning board
- Google Calendar OAuth 2.0 one-way sync

## Local setup
1. Copy `.env.example` to `.env.local` and fill in credentials.
2. Apply `supabase/schema.sql` in your Supabase SQL editor.
3. Install dependencies and run the dev server:
   ```bash
   npm install
   npm run dev
   ```

## Architecture highlights
- **Auth + route protection:** `middleware.ts` ensures users are authenticated and subscribed before dashboard/calendar access.
- **Data ownership:** Supabase Row Level Security enforces user-scoped reads/writes.
- **Reassurance logic:** Rule engine in `lib/reassurance.ts` keeps dashboard messaging modular and extendable.
- **Calendar event flow:** Drag/drop and edits call `app/api/calendar/items/[type]/[id]/route.ts`, which persists schedule dates and mirrors changes to Google Calendar when connected.
- **Billing:** Stripe Checkout and webhook routes update `users.subscription_status` and gate premium pages.

## Deploying to Vercel
1. Create a Vercel project from this repo.
2. Add all values from `.env.example` in Vercel environment settings.
3. Configure Stripe webhook endpoint: `https://<your-domain>/api/stripe/webhook`.
4. Add Google OAuth redirect URI: `https://<your-domain>/api/google/callback`.
5. Redeploy.
