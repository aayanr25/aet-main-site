# Chi Psi — Alpha Epsilon Tau (Purdue University)

Website for the Alpha Epsilon Tau chapter of Chi Psi, chartered 2023.

Built with **React + Vite + TypeScript + Tailwind CSS**, deployed on **Cloudflare Pages**. All photos are pulled live from **Google Drive**, so the site can be kept up to date by editing Drive folders — no code changes required.

---

## How images work

Each page reads photos from a Google Drive folder. Folder IDs live in
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
