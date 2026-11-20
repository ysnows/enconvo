type NamedUser = {
  email?: string | null
  user_metadata?: Record<string, unknown> | null
}

/**
 * The name to show for an account: the one it has (Apple and Google send one), else the part of
 * its email before the @. The fallback is only shown, never saved as the name, because plugin
 * comments show names publicly.
 */
export function displayName(user: NamedUser | null | undefined): string {
  const metadata = user?.user_metadata ?? {}
  for (const value of [metadata.name, metadata.full_name])
    if (typeof value === 'string' && value.trim()) return value.trim()
  return (user?.email ?? '').split('@')[0]
}
