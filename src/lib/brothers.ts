import type { Member } from '../../functions/api/members'

export type { Member }

/** Fetches the brother roster from our same-origin proxy. */
export async function fetchMembers(): Promise<Member[]> {
  const res = await fetch('/api/members')
  if (!res.ok) {
    const { error } = (await res.json().catch(() => ({ error: res.statusText }))) as {
      error?: string
    }
    throw new Error(error || 'Failed to load roster')
  }
  return (await res.json()) as Member[]
}

/**
 * Validates a typed name against the roster (case-insensitive, trimmed). Matches:
 *   - "First Last"
 *   - "Nickname Last" (when the member has a nickname)
 *   - "Nickname" alone (when the member has a nickname)
 */
export function matchesMember(input: string, members: Member[]): boolean {
  const query = input.trim().toLowerCase()
  if (!query) return false

  return members.some((m) => {
    const first = m.first.trim().toLowerCase()
    const last = m.last.trim().toLowerCase()
    const nick = m.nickname.trim().toLowerCase()

    if (first && last && query === `${first} ${last}`) return true
    if (nick && last && query === `${nick} ${last}`) return true
    if (nick && query === nick) return true
    return false
  })
}

/** Checks the shared chapter passcode. Resolves to whether it matched. */
export async function verifyPasscode(passcode: string): Promise<boolean> {
  const res = await fetch('/api/verify-passcode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode }),
  })
  if (!res.ok) {
    throw new Error('Something went wrong. Please try again.')
  }
  const { valid } = (await res.json()) as { valid: boolean }
  return valid
}
