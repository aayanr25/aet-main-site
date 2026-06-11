// Non-secret identifiers for the Brothers portal — safe to commit.
// The passcode is NOT here; it stays in env vars (.dev.vars / Cloudflare) as
// BROTHERS_PASSCODE. The roster sheet reuses the same GOOGLE_DRIVE_API_KEY as the
// photos and rush calendar, and must be shared "Anyone with the link → Viewer".
export const BROTHERS_CONFIG = {
  rosterSheetId: '1XHAsME5GMGJ31MM0Uo77hFWdXBSB9E1_YDywiFGzNtI',
  rosterSheetTab: 'Roster', // update if the actual tab name differs
  sessionStorageKey: 'aet_brothers_auth',
}
