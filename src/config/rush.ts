// Non-secret identifiers for the Rush page — safe to commit.
// The Google API key is NOT here; it stays in env vars (.dev.vars / Cloudflare).
// See the "Rush calendar" section of README.md for the full setup.
export const RUSH = {
  // Google Sheet ID, from docs.google.com/spreadsheets/d/<THIS_PART>/edit
  sheetId: '1dYC0Wl2giidIncCjt67PQ2VLYObuy1VGxu0EF4au5Rs',
  // Tab name; also used as the A1 range covering the whole tab.
  sheetTab: 'Events',
  // Google Form embed URL: Forms -> Send -> < > (Embed HTML) -> the src="..." value.
  googleFormEmbedUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSebADDXZpR_0a_xpzOeoBqYMyc_KFPKxDxD8JibSUvUHBY7OQ/viewform?embedded=true',
}