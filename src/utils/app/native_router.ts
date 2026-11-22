import { supabase } from '@/lib/supabase'
import { WORKER_API_ORIGIN, workerRequest } from '@/lib/worker-api'
import type { NativeCodeChallenge } from '@/lib/auth-flow'

/** `signed_out`: the browser has no live session, so the page should ask the user to sign in. */
export type OpenAppResult = 'opened' | 'signed_out' | { error: string }

type AppSession = { accessToken: string; refreshToken: string }

const HANDOFF_ERROR = "Couldn't open Enconvo. Go back to the app and try signing in again."

/** A PKCE S256 challenge: base64url of a SHA-256 hash, no padding. */
const S256_CHALLENGE = /^[A-Za-z0-9_-]{43}$/
/** The one-time code `native_handoff/create` answers, as it goes into the link. */
const HANDOFF_CODE = /^[A-Za-z0-9._~-]{1,512}$/

/**
 * Asks the Worker for a one-time code the app trades for a session of its own with the verifier
 * behind `challenge`. Nothing here is logged: the access token and the code stay out of logs.
 */
async function handoffCode(
    accessToken: string,
    challenge: NativeCodeChallenge
): Promise<{ code: string } | 'signed_out' | { error: string }> {
    let response: Response
    try {
        response = await fetch(`${WORKER_API_ORIGIN}/api/native_handoff/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({ code_challenge: challenge.challenge, code_challenge_method: 'S256' }),
        })
    } catch {
        return { error: 'Could not reach Enconvo. Check your connection and try again.' }
    }
    const body = await response.json().catch(() => null)
    if (response.status === 401) return 'signed_out'
    // The code at the top, or in the Worker's `{ code: 200, data }` envelope.
    const code = typeof body?.data?.code === 'string' ? body.data.code : typeof body?.code === 'string' ? body.code : null
    if (response.ok && code && HANDOFF_CODE.test(code)) return { code }
    return { error: typeof body?.message === 'string' && body.message ? body.message : HANDOFF_ERROR }
}

export const NativeRouter = {

    login: (accessToken: string, refreshToken: string, source?: string) => {
        // `source` (e.g. "guide") lets the app return the user to wherever login was
        // started from instead of always opening Settings after sign-in.
        let url = `enconvo://login?access_token=${accessToken}&refresh_token=${refreshToken}`;
        if (source) {
            url += `&source=${encodeURIComponent(source)}`;
        }
        window.location.href = url;
    },

    /**
     * Opens Enconvo signed in to this browser's account with a session of its own,
     * so signing out of one leaves the other signed in and the two never spend the
     * same refresh token. The browser's session is checked with the auth service
     * first: one that was signed out is never handed over.
     *
     * `handoff: 'exchange'` (sent by apps that make that session themselves)
     * opens Enconvo at once with the browser's access token; the app asks the
     * Worker for its session while it shows "Signing in…". Pages that open the
     * app on load must confirm the session with `getUser()` first.
     *
     * `codeChallenge` (sent by apps that keep a PKCE verifier, Android's) opens
     * Enconvo with a one-time code instead (`enconvo://login?code=…`), which only
     * that verifier trades for the app's session; no tokens ever go in the link.
     * Without one (iOS, the Mac, older Android builds) nothing changes.
     */
    openApp: async (source?: string, handoff?: string, codeChallenge?: NativeCodeChallenge): Promise<OpenAppResult> => {
        // The session now, not the one the page loaded with: it may have been
        // refreshed or signed out since.
        let { data: { session } } = await supabase.auth.getSession()
        if (!session) return 'signed_out'

        if (codeChallenge) {
            // An app that sent a challenge takes nothing else: a bad one is an error, never tokens.
            if (codeChallenge.method !== 'S256' || !S256_CHALLENGE.test(codeChallenge.challenge)) return { error: HANDOFF_ERROR }
            if ((session.expires_at ?? 0) * 1000 - Date.now() < 60_000) {
                const refreshed = await supabase.auth.refreshSession()
                if (refreshed.data.session) session = refreshed.data.session
                else if (refreshed.error?.status && refreshed.error.status < 500) return 'signed_out'
            }
            const result = await handoffCode(session.access_token, codeChallenge)
            if (result === 'signed_out') {
                // Signed out only once the auth service says so too.
                const { data: { user }, error } = await supabase.auth.getUser()
                if (!user && error?.status && error.status >= 400 && error.status < 500) {
                    await supabase.auth.signOut({ scope: 'local' })
                    return 'signed_out'
                }
                return { error: HANDOFF_ERROR }
            }
            if ('error' in result) return result
            let url = `enconvo://login?code=${encodeURIComponent(result.code)}`
            if (source) url += `&source=${encodeURIComponent(source)}`
            window.location.href = url
            return 'opened'
        }

        if (handoff === 'exchange') {
            // The app exchanges the token a few seconds from now.
            if ((session.expires_at ?? 0) * 1000 - Date.now() < 60_000) {
                const refreshed = await supabase.auth.refreshSession()
                if (refreshed.data.session) session = refreshed.data.session
                else if (refreshed.error?.status && refreshed.error.status < 500) return 'signed_out'
            }
            let url = `enconvo://login?exchange_token=${encodeURIComponent(session.access_token)}`
            if (source) url += `&source=${encodeURIComponent(source)}`
            window.location.href = url
            return 'opened'
        }

        const result = await workerRequest<AppSession>('/api/app_session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
            body: '{}',
        })
        if (result.ok) {
            NativeRouter.login(result.data.accessToken, result.data.refreshToken, source)
            return 'opened'
        }
        if (result.reason === 'signed_out') {
            await supabase.auth.signOut({ scope: 'local' })
            return 'signed_out'
        }
        if (result.reason === 'account_blocked') return { error: result.message }

        // The Worker couldn't make a session (unreachable, or an older deploy):
        // hand over the browser's own, once the auth service confirms it.
        const { data: { user }, error } = await supabase.auth.getUser()
        if (user) {
            NativeRouter.login(session.access_token, session.refresh_token, source)
            return 'opened'
        }
        if (error?.status && error.status >= 400 && error.status < 500) {
            await supabase.auth.signOut({ scope: 'local' })
            return 'signed_out'
        }
        return { error: result.message }
    },

    install: (name: string, title: string, downloadUrl: string) => {
        window.location.href = `enconvo://install?name=${name}&title=${title}&downloadUrl=${downloadUrl}`;
    }
};
