import type { UseCase } from '../data/useCases'

export const ALL_USE_CASES = 'All'

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

/** Search across the actual walkthrough content; every word must match. */
export function filterUseCases(
  items: UseCase[],
  category: string,
  query: string,
  translate: (text: string) => string = (text) => text
) {
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean)
  return items.filter((item) => {
    if (category !== ALL_USE_CASES && item.category !== category) return false
    const text = normalize(
      `${item.title} ${item.description} ${item.category} ${translate(
        item.title
      )} ${translate(item.description)} ${translate(item.category)}`
    )
    return terms.every((term) => text.includes(term))
  })
}

/** Newest first: the one order the homepage preview and /use-cases share. */
export function newestFirst(items: UseCase[]) {
  return [...items].sort((a, b) => b.date.localeCompare(a.date))
}

export function useCaseCategories(items: UseCase[]) {
  return [
    ALL_USE_CASES,
    ...Array.from(new Set(items.map((item) => item.category))),
  ]
}
