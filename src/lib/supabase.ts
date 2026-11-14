import { createClientComponentClient as createHelperClient } from '@supabase/auth-helpers-nextjs'
import { authCookieOptions, forgetLegacyAuthCookie } from './auth-cookie'

/**
 * The browser's Supabase client, always with the site's sign-in cookie (lib/auth-cookie). It is one
 * shared instance: the first call's options win, so every page creates it through here.
 */
export function createClientComponentClient(): ReturnType<typeof createHelperClient> {
  forgetLegacyAuthCookie()
  return createHelperClient({ cookieOptions: authCookieOptions })
}

export const supabase = createClientComponentClient()
