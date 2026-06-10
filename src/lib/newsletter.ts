import type {
  NewsletterArchiveResponse,
  NewsletterCurrentResponse,
} from '../../functions/api/newsletter'

export type NewsletterPdf = NonNullable<NewsletterCurrentResponse['pdf']>
export type NewsletterIssue = NewsletterArchiveResponse['issues'][number]

async function readError(res: Response): Promise<string> {
  const { error } = (await res.json().catch(() => ({ error: res.statusText }))) as {
    error?: string
  }
  return error || 'Something went wrong.'
}

/** Fetches the single current newsletter PDF, or null if none is published. */
export async function fetchCurrentNewsletter(): Promise<NewsletterPdf | null> {
  const res = await fetch('/api/newsletter?type=current')
  if (!res.ok) {
    throw new Error(await readError(res))
  }
  const { pdf } = (await res.json()) as NewsletterCurrentResponse
  return pdf
}

/** Fetches past newsletter issues, newest first. */
export async function fetchNewsletterArchive(): Promise<NewsletterIssue[]> {
  const res = await fetch('/api/newsletter?type=archive')
  if (!res.ok) {
    throw new Error(await readError(res))
  }
  const { issues } = (await res.json()) as NewsletterArchiveResponse
  return issues
}

interface SignupResponse {
  success: boolean
  error?: string
}

/**
 * Joins the mailing list. Resolves on success; rejects with the server's
 * (user-safe) message on failure so the form can show it inline.
 */
export async function subscribeNewsletter(email: string): Promise<void> {
  const res = await fetch('/api/newsletter-signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const data = (await res.json().catch(() => ({ success: false }))) as SignupResponse
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Something went wrong. Please try again.')
  }
}
