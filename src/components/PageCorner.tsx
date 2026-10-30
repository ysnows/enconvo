import { createContext, useContext, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

const CornerSlot = createContext<HTMLElement | null>(null)

/** The look of a control in the top-right group, matching the language picker. */
export const pageCornerControlClass =
  'flex min-h-[40px] min-w-[40px] items-center justify-center gap-1.5 rounded-[10px] border border-white/10 bg-[#141A22]/90 px-3 text-[12px] text-[#F4F7FB] backdrop-blur-md transition-colors hover:bg-[#202832] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60'

/**
 * The fixed top-right group of pages without the site navigation: the language picker, then
 * whatever the page adds with PageCornerActions, so the page never draws a second header there.
 */
export function PageCorner({
  visible,
  children,
}: {
  visible: boolean
  children: ReactNode
}) {
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  return (
    <CornerSlot.Provider value={slot}>
      {visible && (
        <div className="fixed right-4 top-4 z-[60] flex items-center gap-2">
          <LanguageSwitcher placement="page" />
          <div ref={setSlot} className="contents" />
        </div>
      )}
      {children}
    </CornerSlot.Provider>
  )
}

/** Controls placed after the language picker in the top-right group; nothing where it isn't shown. */
export function PageCornerActions({ children }: { children: ReactNode }) {
  const slot = useContext(CornerSlot)
  return slot ? createPortal(children, slot) : null
}
