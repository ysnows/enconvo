import { supabase } from '@/lib/supabase'
import { workerRequest } from '@/lib/worker-api'

/** `signed_out`: the browser has no live session, so the page should ask the user to sign in. */
export type OpenAppResult = 'opened' | 'signed_out' | { error: string }

type AppSession = { accessToken: string; refreshToken: string }

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
     */
    openApp: async (source?: string): Promise<OpenAppResult> => {
        // The session now, not the one the page loaded with: it may have been
        // refreshed or signed out since.
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return 'signed_out'

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
