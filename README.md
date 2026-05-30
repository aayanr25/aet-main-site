# Chi Psi — Alpha Epsilon Tau (Purdue University)

Website for the Alpha Epsilon Tau.

Built with **React + Vite + TypeScript + Tailwind CSS**, deployed on **Cloudflare Pages**. All photos are pulled live from **Google Drive**, so the site can be kept up to date by editing Drive folders — no code changes required.

---

## How images work

Each page reads photos from a Google Drive folder (VPO->Photos/Videos->[DONT MOVE] Website Photos). Folder IDs live in
[`src/config/photos.ts`](src/config/photos.ts):

```ts
export const DRIVE_FOLDER_IDS = {
  home: '…',
  rush: '…',
  gallery: '…',
  about: '…',
}
```

Images are fetched through a Cloudflare Pages Function (`functions/api/photos.ts`)
that talks to the Google Drive API using a server-side `GOOGLE_DRIVE_API_KEY`,
then streamed via `functions/api/image.ts`. The API key is **never** exposed to
the browser.

> Every folder must be shared as **"Anyone with the link → Viewer."**

### The logo

The site logo is just a file in the **homepage** folder whose name contains `logo`
(e.g. `purduechipsi-logo.png`). It is automatically shown in the navbar and
excluded from photo grids. Replace that file in Drive to change the logo.

---

## Executive board — names are generated from filenames

**The most important convention.** Executive board member names and roles are
**never hard coded** in the website. They are derived automatically from the
photo filenames in the **about** Drive folder. The parsing logic lives in
[`src/lib/execBoard.ts`](src/lib/execBoard.ts).

### Required filename format

```
<Role>-<First>_<Last>.<ext>
```

| Part      | Rule                                                             |
| --------- | --------------------------------------------------------------- |
| `<Role>`  | One or more words joined by underscores. e.g. `President`, `Internal_VP`, `Sergeant_At_Arms` |
| `-`       | **A single hyphen** separates the role from the name. Required.  |
| `<First>_<Last>` | The member's name, words joined by underscores.          |
| `<ext>`   | `.jpg`, `.JPG`, `.jpeg`, `.png`, … (any image type)              |

### Examples

| Drive filename                          | Rendered name     | Rendered role       |
| --------------------------------------- | ----------------- | ------------------- |
| `President-Vihaan_Chadha.JPG`           | Vihaan Chadha     | President           |
| `Internal_VP-Adarsh_Prathap.JPG`        | Adarsh Prathap    | Internal VP         |
| `Sergeant_At_Arms-Nathan_McKinley.JPG`  | Nathan McKinley   | Sergeant At Arms    |
| `VPO-Aayan_Ramamurthy.png`              | Aayan Ramamurthy  | VPO                 |


### Casing

Filename casing is **preserved**, so `McKinley` stays `McKinley` and acronyms
like `VP` / `VPO` stay uppercase. A lowercase first letter is still
auto-capitalized, so `president_john_doe`-style names also render correctly
(→ `John Doe`).

---

## Updating the executive board (no code required)

To add, remove, or replace a board member, **only edit the about Drive folder:**

1. **Add a member** — upload a photo named `Role-First_Last.ext`
   (e.g. `Webmaster-Jordan_Lee.jpg`). It appears automatically.
2. **Replace a member's photo** — delete the old file and upload a new one with
   the same name (or a corrected name).
3. **Remove a member** — delete their photo from the folder.

That's it. The site reads the folder on load and regenerates the board. Files
that don't follow the `Role-Name` format (like the founder photo
`philip_spencer.jpg`) are simply ignored by the board.

### Display order (optional)

Members are shown most-senior-first using the `ROLE_ORDER` list at the top of
[`src/lib/execBoard.ts`](src/lib/execBoard.ts). This list contains **role names
only — never member names.** A brand-new role not in the list still appears
(after the listed roles, alphabetically); add its token to the list only if you
want to control where it sits. Adding or removing *members* never requires
touching this.

---

## Rush calendar (Google Sheet)

The Rush page calendar is driven by a Google Sheet you edit directly — changes
appear on the site within about a minute, no code or deploy needed. It reuses the
**same** `GOOGLE_DRIVE_API_KEY` as the photos (no new key, no new env var).

### What you MUST do once (setup)
**Fill in the config** in [`src/config/rush.ts`](src/config/rush.ts) (these are
   not secrets, so they live in the repo):
   - `sheetId` — from the sheet URL: `docs.google.com/spreadsheets/d/`**`<this part>`**`/edit`
   - `sheetTab` — the tab name, e.g. `Events`
   - `googleFormEmbedUrl` — in Google Forms: **Send → `< >` (Embed HTML) →** copy
     the URL inside `src="..."`
     USE THE SAME RUSH FORM OR YOU NEED TO CHANGE THIS IN THE CODE

> The API key itself is **not** in the code — it stays in `.dev.vars` (local) and
> Cloudflare Pages → Environment Variables (production), exactly as set up for the
> photos.

### How to edit the calendar (ongoing)

Edit the sheet directly. **Row 1 must be the header row.** Required columns:

| Date | Time | Title | Location | Type |
|------|------|-------|----------|------|
| Sep 8, 2025 | 7:00 PM | Cookout at the Lodge | 123 Northwestern Ave | Open |
| Sep 11, 2025 | 8:00 PM | Game Night | PMU, Room 230 | Open |
| Sep 14, 2025 | 6:00 PM | Formal Smoker | The Lodge | Invite-only |

Rules:

- **Column order doesn't matter** and extra columns are ignored — columns are
  matched by their header name (case-insensitive). Reorder or add your own notes
  columns freely.
- **Date** — include the year: `Sep 8, 2025` or `9/8/2025`.
- **Time** — start time as text: `7:00 PM`.
- **Type** — `Open` or `Invite-only` (anything starting with "invite" shows the
  invite badge; blank counts as open).
- Blank rows, or rows missing a Date or Title, are skipped.
- Past events disappear automatically; events are shown soonest-first.

To add, change, or remove an event, just edit/add/delete its row in the sheet.

---

## Local development

```bash
cp .dev.vars.example .dev.vars   # then paste your GOOGLE_DRIVE_API_KEY
npm install
npm run dev                      # Wrangler proxies /api/* and serves the app
npm run build                    # type-check (app + functions) and bundle
```

## Deploying

Connect the repo to Cloudflare Pages with build command `npm run build` and
output directory `dist`. Set `GOOGLE_DRIVE_API_KEY` in the Pages project's
environment variables (Production **and** Preview).
