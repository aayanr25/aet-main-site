# Rush Page Redesign — Design Spec

**Date:** 2026-05-29
**Status:** Approved (pending final spec review)

## Goal

Rebuild the Rush page around three must-haves:

1. A **rush calendar** driven by a Google Sheet (editable directly in the sheet,
   near-real-time on the site).
2. An **embedded Google Form** interest form.
3. **Photos** from the existing rush Drive folder.

The current "Rush Process" 4-step section is removed.

## Page structure (`src/pages/Rush.tsx`)

Top to bottom:

1. **Hero** — existing purple hero ("Find Your Brotherhood"), kept.
2. **Rush Calendar** — upcoming events as a chronological list.
3. **Interest Form** — embedded Google Form (iframe).
4. **Photos** — existing `PhotoGrid` on the rush folder, unchanged.

## Calendar display

Decision: **upcoming-events list** (not a month grid). Each event is a card/row
showing:

- **Date** (e.g. "SEP 8")
- **Time** (e.g. "7:00 PM")
- **Title**
- **Location** (with a pin icon)
- **Open / Invite-only badge**

Past events are hidden automatically. When there are no upcoming events, show a
friendly empty state ("No upcoming events — check back soon").

## Data flow

```
Google Sheet  →  functions/api/calendar.ts  →  /api/calendar (JSON)  →  src/lib/calendar.ts  →  <RushCalendar/>
   (you edit)      (server-side, API key)         (edge-cached ~60s)        (fetch + parse)        (renders list)
```

Mirrors the existing photo architecture: the browser only talks to a same-origin
`/api/calendar` endpoint; the API key never reaches the client.

## API key & access setup (reuses the existing key)

No new API key and no new environment variable. The calendar function reads the
same `GOOGLE_DRIVE_API_KEY` already used by the photo functions.

One-time setup:

1. **Enable the Google Sheets API** on the Google Cloud project that owns the key
   (APIs & Services → Library → "Google Sheets API" → Enable).
2. **Allow Sheets on the key** — if the key has API restrictions, ensure both
   Google Drive API **and** Google Sheets API are permitted. (Missing this
   produces a 403, the same failure mode seen with photos.)
3. **Share the sheet** — "Anyone with the link → Viewer."

Key locations (already configured for photos):

- Local dev: `.dev.vars` → `GOOGLE_DRIVE_API_KEY=...`
- Production: Cloudflare Pages → Settings → Environment Variables → `GOOGLE_DRIVE_API_KEY`

## Non-secret config (`src/config/rush.ts`)

Committed to the repo (not sensitive):

```ts
export const RUSH = {
  sheetId: '<spreadsheet id from the sheet URL>',
  sheetTab: 'Events',           // tab name / A1 range
  googleFormEmbedUrl: '<iframe src from Forms → Send → Embed HTML>',
}
```

- **Sheet ID**: from `docs.google.com/spreadsheets/d/<SHEET_ID>/edit`.
- **Form embed URL**: Google Forms → Send → `< >` (Embed HTML) → the `src="..."`.

## The Google Sheet

One tab (e.g. **Events**). Row 1 is headers. Required columns: **Date, Time,
Title, Location, Type.**

| Date | Time | Title | Location | Type |
|------|------|-------|----------|------|
| Sep 8, 2025 | 7:00 PM | Cookout at the Lodge | 123 Northwestern Ave | Open |
| Sep 11, 2025 | 8:00 PM | Game Night | PMU, Room 230 | Open |
| Sep 14, 2025 | 6:00 PM | Formal Smoker | The Lodge | Invite-only |

Rules:

- **Column order doesn't matter** and extra columns are ignored — columns are
  matched by header name, case-insensitive. (Same resilience as exec-board
  filename parsing.)
- **Date** includes the year: `Sep 8, 2025` or `9/8/2025`.
- **Time** is the start time as text: `7:00 PM`.
- **Type** = `Open` or `Invite-only` (value starting with "invite" → invite
  badge; blank/anything else → open).
- Blank rows, or rows missing Date or Title, are skipped.
- Events whose Date+Time are in the past are hidden.

## Components & files

- `src/config/rush.ts` — sheet ID, tab, Google Form embed URL.
- `functions/api/calendar.ts` — Sheets API proxy. Calls
  `https://sheets.googleapis.com/v4/spreadsheets/{id}/values/{range}?key=...`,
  maps the header row to fields, returns normalized event JSON. Sets
  `Cache-Control: public, s-maxage=60, stale-while-revalidate=...`. Logs upstream
  errors; returns a JSON error on failure.
- `src/lib/calendar.ts` — `fetchRushEvents()`, `RushEvent` type, date parsing,
  chronological sort, past-event filtering.
- `src/components/RushCalendar.tsx` — renders the upcoming-events list with
  loading skeleton, error, and empty states; date chip, time, title, location +
  pin, open/invite badge.
- `src/pages/Rush.tsx` — composes hero + calendar + form + photos; removes the
  Rush Process section.
- `README.md` — document the sheet setup (enable Sheets API, share, columns, date
  format, config values).

## Freshness vs. quota (photo-API lessons applied)

- The calendar is a **single small JSON request** per load (not bulk binary like
  the photo downloads), so the anti-bot throttling that hit photos does not apply.
- **Edge cache ~60s** (`s-maxage=60`): updates appear within ~1 minute while
  shielding the Sheets API from per-visitor load. Tunable down to 0 for instant
  updates at the cost of more API calls.
- Sheets API quota (~300 reads/min) is comfortably safe with the cache.
- Server-side key only; never exposed to the browser.

## Date parsing (the main risk)

Dates/times are the classic bug source. Parse `Date + Time` together (e.g.
`new Date("Sep 8, 2025 7:00 PM")`), interpreted in the visitor's local timezone.
Rows that fail to parse are skipped, with a server-side warning to help the
maintainer spot a malformed row. Parsing will be verified against the real sheet
(curl the endpoint) before the work is considered done — the same way the photo
endpoints were verified.

## Verification

- `npm run build` passes (app + functions type-check).
- `curl` the deployed `/api/calendar` against the real sheet; confirm events parse
  with correct dates, ordering, past-event filtering, and badges.
- Manually confirm the embedded form loads and the photo grid still renders.
