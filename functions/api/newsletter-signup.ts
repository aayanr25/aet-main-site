/// <reference types="@cloudflare/workers-types" />

interface Env {
  GOOGLE_PEOPLE_OAUTH_TOKEN: string
}

interface SignupBody {
  email?: unknown
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

  const token = context.env.GOOGLE_PEOPLE_OAUTH_TOKEN
  if (!token) {
    console.error('GOOGLE_PEOPLE_OAUTH_TOKEN is not configured')
    return json({ success: false, error: 'Something went wrong. Please try again.' }, 500)
  }

  try {
    const res = await fetch('https://people.googleapis.com/v1/people:createContact', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emailAddresses: [{ value: email }],
        memberships: [
          {
            // TODO: replace 'contactGroups/Newsletter' with the actual resourceName from the Google People API for the 'Newsletter' label. Run: GET https://people.googleapis.com/v1/contactGroups to find it.
            contactGroupMembership: { contactGroupResourceName: 'contactGroups/Newsletter' },
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
