/// <reference types="@cloudflare/workers-types" />

interface Env {
  // OAuth2 credentials for the secretary.purduechipsi@gmail.com account. The
  // refresh token is the durable secret; it's exchanged for a short-lived access
  // token on each request (see getAccessToken below).
  GOOGLE_PEOPLE_CLIENT_ID: string
  GOOGLE_PEOPLE_CLIENT_SECRET: string
  GOOGLE_PEOPLE_REFRESH_TOKEN: string
}

interface SignupBody {
  email?: unknown
}

interface TokenResponse {
  access_token?: string
}

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const

// Allow the frontend (any origin, since this is a public mailing-list signup)
// to POST here. Mirrors the Access-Control headers a browser preflight expects.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const

// Basic shape check — the People API is the real source of truth, this just
// rejects obvious typos before we spend a request on them.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...CORS_HEADERS },
  })
}

// Exchanges the long-lived refresh token for a fresh, short-lived access token.
// Access tokens expire in ~1 hour, so we mint a new one per signup rather than
// storing one that would go stale. Returns null if the exchange fails.
async function getAccessToken(env: Env): Promise<string | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_PEOPLE_CLIENT_ID,
      client_secret: env.GOOGLE_PEOPLE_CLIENT_SECRET,
      refresh_token: env.GOOGLE_PEOPLE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    console.error(`Token exchange ${res.status}:`, detail)
    return null
  }

  const data = (await res.json()) as TokenResponse
  return data.access_token ?? null
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: SignupBody
  try {
    body = (await context.request.json()) as SignupBody
  } catch {
    return json({ success: false, error: 'Invalid email address' }, 400)
  }

  const email = typeof body.email === 'string' ? body.email.trim() : ''
  if (!EMAIL_RE.test(email)) {
    return json({ success: false, error: 'Invalid email address' }, 400)
  }

  const { GOOGLE_PEOPLE_CLIENT_ID, GOOGLE_PEOPLE_CLIENT_SECRET, GOOGLE_PEOPLE_REFRESH_TOKEN } =
    context.env
  if (!GOOGLE_PEOPLE_CLIENT_ID || !GOOGLE_PEOPLE_CLIENT_SECRET || !GOOGLE_PEOPLE_REFRESH_TOKEN) {
    console.error('Google People OAuth credentials are not fully configured')
    return json({ success: false, error: 'Something went wrong. Please try again.' }, 500)
  }

  try {
    const accessToken = await getAccessToken(context.env)
    if (!accessToken) {
      return json({ success: false, error: 'Something went wrong. Please try again.' }, 500)
    }

    const res = await fetch('https://people.googleapis.com/v1/people:createContact', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emailAddresses: [{ value: email }],
        memberships: [
          {
            // TODO: replace 'contactGroups/Newsletter' with the actual resourceName from the Google People API for the 'Newsletter' label. Run: GET https://people.googleapis.com/v1/contactGroups to find it.
            contactGroupMembership: { contactGroupResourceName: 'contactGroups/4ecfd5f88313301' },
          },
        ],
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error(`People API ${res.status}:`, detail)
      return json({ success: false, error: 'Something went wrong. Please try again.' }, 500)
    }
  } catch (err) {
    console.error('People API request failed:', err)
    return json({ success: false, error: 'Something went wrong. Please try again.' }, 500)
  }

  return json({ success: true }, 200)
}
