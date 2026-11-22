// What people wrote about Enconvo in public, with a link to each original post.
// love.json (every post, for /love) and loveHome.json (the homepage's picks) are
// generated together from the collected posts; edit neither by hand. A post is
// shown in the person's own words: never translate, reword or correct it.
export type LoveSource = 'discord' | 'reddit' | 'facebook'

export interface LovePost {
  id: string
  source: LoveSource
  name: string
  /** The channel, subreddit or group it was posted in. */
  place: string
  /** The UTC day it was posted, YYYY-MM-DD. */
  date: string
  text: string
  url: string
  /** The person's own avatar, or the platform's default one when they set none. */
  avatar: string
  /** A phrase of the text to bring out. */
  hl?: string
  /** Short enough to set large. */
  big?: boolean
  /** The excerpt starts, or ends, in the middle of a sentence. */
  lead?: boolean
  trail?: boolean
  /** Set when the post is not in English. */
  lang?: string
}

export const sourceNames: Record<LoveSource, string> = {
  discord: 'Discord',
  reddit: 'Reddit',
  facebook: 'Facebook',
}

export const DISCORD_INVITE = 'https://discord.gg/jYsdVRRK2k'

/** "Discord and Reddit", in the reader's language. */
export function sourceList(sources: LoveSource[], locale: string) {
  const names = sources.map((source) => sourceNames[source])
  // Chinese sets Latin names apart from the characters around them, which the list format doesn't.
  if (locale.startsWith('zh') && names.length > 1)
    return `${names.slice(0, -1).join('、')} 和 ${names[names.length - 1]}`
  try {
    return new Intl.ListFormat(locale, { type: 'conjunction' }).format(names)
  } catch {
    return names.join(', ')
  }
}
