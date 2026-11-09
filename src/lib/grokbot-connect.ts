// /grokbot/connect is Grok Bot's OAuth consent page: Grok Bot's connector sign-in sends the browser here with a
// signed `request`, and the signed-in account approves or denies it. The Worker routes take the Supabase access
// token as `Authorization: Bearer` and answer with the URL to send the browser back to.

import { workerRequest } from '@/lib/worker-api'

export interface GrokBotConnectRequest {
    /** Grok Bot's own callback, or a loopback address: an app on this computer. */
    client: 'grok_bot' | 'local_app'
    /** The name another client registered with, when it gave one; the page names it with its return host. */
    client_name?: string | null
    /** Where approving or denying sends the browser. */
    redirect_host: string
    /** The Mac Grok Bot will reach: the one the account connected Grok Bot from, or null when none has. */
    mac: { name: string | null } | null
    expires_at: number
}

function signedPost<T>(path: string, accessToken: string, body: unknown) {
    return workerRequest<T>(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(body),
    })
}

export function inspectGrokBotRequest(accessToken: string, request: string) {
    return signedPost<GrokBotConnectRequest>('/oauth/grokbot/inspect', accessToken, { request })
}

export function answerGrokBotRequest(accessToken: string, request: string, approve: boolean) {
    return signedPost<{ redirect: string }>('/oauth/grokbot/approve', accessToken, { request, approve })
}
