// JSON routes on the Enconvo Worker (api.enconvo.com) that answer `{ code: 200, data }`
// or `{ code, reason, message }`: Invites, Trial codes and License codes. Signed-in calls pass the
// Supabase access token in the `accessToken` header.

export const WORKER_API_ORIGIN = process.env.NEXT_PUBLIC_WORKER_API_ORIGIN || 'https://api.enconvo.com'

const GENERIC_ERROR = 'Something went wrong. Please try again.'

// Both branches list every field so reads type-check without strictNullChecks
// (this project has `strict: false`, which turns off discriminated-union narrowing).
export type WorkerResult<T> =
    | { ok: true; data: T; status?: undefined; reason?: undefined; message?: undefined; terminal?: undefined }
    // status 0 = the request never got a response.
    | { ok: false; data?: undefined; status: number; reason: string; message: string; terminal: boolean }

export async function workerRequest<T>(path: string, init: RequestInit = {}): Promise<WorkerResult<T>> {
    let response: Response
    try {
        response = await fetch(`${WORKER_API_ORIGIN}${path}`, init)
    } catch {
        return {
            ok: false,
            status: 0,
            reason: 'network_error',
            message: 'Could not reach Enconvo. Check your connection and try again.',
            terminal: false,
        }
    }
    const body = await response.json().catch(() => null)
    if (response.ok && body?.data) return { ok: true, data: body.data as T }

    const reason = typeof body?.reason === 'string' ? body.reason : ''
    return {
        ok: false,
        status: response.status,
        reason: reason || 'server_error',
        message: typeof body?.message === 'string' && body.message ? body.message : GENERIC_ERROR,
        // Only a decision the Worker explains is final. A bare 4xx from the edge
        // (missing route, challenge page) or a 401/408/429 is worth another try.
        terminal: !!reason
            && response.status >= 400
            && response.status < 500
            && ![401, 408, 429].includes(response.status),
    }
}

/** A signed-in JSON POST. */
export function workerPost<T>(path: string, accessToken: string, body: unknown = {}) {
    return workerRequest<T>(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', accessToken },
        body: JSON.stringify(body),
    })
}
