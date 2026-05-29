import type { DriveImage } from './drive'

/**
 * EXECUTIVE BOARD — derived ENTIRELY from Google Drive filenames.
 * Member names are NEVER hard coded in the frontend.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * REQUIRED FILE NAMING CONVENTION (files live in the "about" Drive folder):
 *
 *     <Role>-<First>_<Last>.<ext>
 *
 * Examples:
 *     President-Vihaan_Chadha.JPG           ->  "Vihaan Chadha"  ·  "President"
 *     Internal_VP-Adarsh_Prathap.JPG        ->  "Adarsh Prathap" ·  "Internal VP"
 *     Sergeant_At_Arms-Nathan_McKinley.JPG  ->  "Nathan McKinley"·  "Sergeant At Arms"
 *
 * RULES:
 *  • A single hyphen "-" separates the ROLE (left) from the NAME (right).
 *    The hyphen is REQUIRED because roles can be multiple words
 *    (Internal_VP, Sergeant_At_Arms). Without it, "sergeant_at_arms_nathan_..."
 *    would be impossible to split unambiguously into role vs. name.
 *  • Within each side, underscores "_" separate words.
 *  • Filename casing is PRESERVED, so "McKinley" stays "McKinley" and acronyms
 *    like "VP"/"VPO" stay uppercase. A lowercase first letter is still
 *    auto-capitalized, so "president_john_doe" style names also render nicely.
 *  • Files that don't match this pattern (e.g. philip_spencer.jpg) are ignored
 *    by the exec board — they simply won't appear here.
 *
 * WHY NAMES ARE NEVER HARD CODED:
 *  The executive board turns over every year. Deriving names + roles from the
 *  Drive files means a future exec updates the board by ONLY editing the Drive
 *  folder (add / remove / replace a photo). No code edits, no developer needed.
 *  Hard coding names would silently go stale and force a code change every term.
 * ───────────────────────────────────────────────────────────────────────────
 */

/**
 * Optional DISPLAY ORDER (most senior first). Lists role tokens exactly as they
 * appear to the LEFT of the hyphen, lowercased. This is the only place chapter
 * *structure* lives — it contains NO member names. Any role not listed here is
 * shown afterward in alphabetical order, so new positions still work with zero
 * changes. Adding / removing MEMBERS never requires touching this list.
 */
const ROLE_ORDER = [
  'president',
  'internal_vp',
  'external_vp',
  'treasurer',
  'sergeant_at_arms',
  'recruitment',
  'vpo',
]

/**
 * Optional pretty labels for roles, keyed by the role token (lowercased, as it
 * appears left of the hyphen in the filename). This is the place to expand
 * abbreviations or add words the filename omits (e.g. "recruitment" ->
 * "Recruitment Chair"). It contains role labels ONLY — never member names.
 * Any role not listed here falls back to the filename's auto-formatted text,
 * so new roles still display correctly without an entry.
 */
const ROLE_LABELS: Record<string, string> = {
  president: 'President',
  internal_vp: 'Internal VP',
  external_vp: 'External VP',
  treasurer: 'Treasurer',
  sergeant_at_arms: 'Sergeant At Arms',
  recruitment: 'Recruitment Chair',
  vpo: 'Vice President of Operations',
}

export interface ExecMember {
  id: string
  name: string // e.g. "Vihaan Chadha" — derived from the filename, never hard coded
  role: string // e.g. "Internal VP" — derived from the filename
  roleToken: string // normalized role key (lowercase), used only for ordering
  image: DriveImage
}

// Uppercases the first character only, preserving the rest of the word.
// Keeps existing capitals (McKinley, VP, VPO) while fixing lowercase (john -> John).
function capitalizeFirst(word: string): string {
  return word ? word.charAt(0).toUpperCase() + word.slice(1) : word
}

// "Vihaan_Chadha" -> "Vihaan Chadha";  "Sergeant_At_Arms" -> "Sergeant At Arms"
function formatSegment(segment: string): string {
  return segment.split('_').filter(Boolean).map(capitalizeFirst).join(' ')
}

/**
 * ⬇️ THIS IS WHERE THE FILENAME PARSING HAPPENS.
 * Converts one Drive image into an ExecMember, or returns null when the
 * filename doesn't follow the "<Role>-<First>_<Last>" convention.
 */
export function parseExecMember(image: DriveImage): ExecMember | null {
  const base = image.name.replace(/\.[^.]+$/, '') // strip the file extension
  const dash = base.indexOf('-') // role / name boundary

  // Reject names without a valid role-then-name split.
  if (dash <= 0 || dash === base.length - 1) return null

  const roleSegment = base.slice(0, dash)
  const nameSegment = base.slice(dash + 1)
  const name = formatSegment(nameSegment)
  if (!name) return null

  const roleToken = roleSegment.toLowerCase()

  return {
    id: image.id,
    name,
    // Prefer a pretty label; fall back to the auto-formatted filename text.
    role: ROLE_LABELS[roleToken] ?? formatSegment(roleSegment),
    roleToken,
    image,
  }
}

/**
 * Parses every conforming exec photo in the folder and returns them sorted by
 * ROLE_ORDER. Non-conforming files are filtered out automatically.
 */
export function getExecBoard(images: DriveImage[]): ExecMember[] {
  const members = images
    .map(parseExecMember)
    .filter((m): m is ExecMember => m !== null)

  const rank = (token: string) => {
    const i = ROLE_ORDER.indexOf(token)
    return i === -1 ? Number.MAX_SAFE_INTEGER : i
  }

  return members.sort(
    (a, b) => rank(a.roleToken) - rank(b.roleToken) || a.role.localeCompare(b.role),
  )
}
