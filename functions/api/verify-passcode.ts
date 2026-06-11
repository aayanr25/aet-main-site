/// <reference types="@cloudflare/workers-types" />

interface Env {
  BROTHERS_PASSCODE: string
}

interface PasscodeBody {
  passcode?: unknown
}

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const

// The portal is gated behind a shared, low-stakes passcode, so the frontend
// (same-origin in practice) is allowed to POST here.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...CORS_HEADERS },
  })
}

// Character-by-character compare so the work doesn't short-circuit on the first
// mismatch. Low-stakes here, but it avoids the obvious timing signal of `===`.
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: PasscodeBody
  try {
    body = (await context.request.json()) as PasscodeBody
  } catch {
    return json({ valid: false }, 200)
  }

  const passcode = typeof body.passcode === 'string' ? body.passcode : ''
  const expected = context.env.BROTHERS_PASSCODE
  if (!expected) {
    console.error('BROTHERS_PASSCODE is not configured')
    return json({ valid: false }, 200)
  }

  return json({ valid: constantTimeEqual(passcode, expected) }, 200)
}
