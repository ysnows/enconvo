import { Menu } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { SiteNav } from '@/components/SiteNav'
import { HeroShowcase } from '@/components/HeroShowcase'

declare global {
  interface Window {
    endorsely_referral?: any
  }
}

function AppleLogoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  )
}

function DownloadRowArrow() {
  return (
    <svg className="w-4 h-4 text-content-ash group-hover:text-content-muted transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3" />
    </svg>
  )
}

export function Hero() {
  return (
    <div className="bg-canvas relative overflow-hidden">
      <SiteNav />

      <div className="relative isolate pt-20 z-10">
        <div className="py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-content leading-tight">
                The assistant your Mac was promised.
              </h1>

              <p className="mt-6 text-lg sm:text-xl leading-relaxed text-content-body max-w-3xl mx-auto">
                Enconvo is an AI agent that lives across your Mac — it sees your
                screen, works inside your apps, and actually gets things done.
              </p>

              <div className="mt-8 flex flex-col items-center space-y-4">
                <Menu as="div" className="relative">
                  <Menu.Button className="group inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-canvas bg-white hover:bg-content rounded-lg transition-colors">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    <span>Download for macOS</span>
                    <ChevronDownIcon className="w-4 h-4 ml-2" />
                  </Menu.Button>

                  <Menu.Items className="absolute top-full mt-2 w-80 bg-surface-elevated backdrop-blur-md rounded-lg shadow-2xl ring-1 ring-hairline focus:outline-none z-50">
                    <div className="p-3">
                      <div className="space-y-1">
                        <Menu.Item>
                          {({ active }) => (
                            <a
                              href="https://api.enconvo.com/app/download?arch=arm64&platform=darwin"
                              target="_blank"
                              rel="noreferrer"
                              className={`${active ? 'bg-surface-card' : ''} group flex items-center w-full px-4 py-3 text-sm font-medium text-content rounded-lg transition-colors`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center">
                                  <AppleLogoIcon className="w-5 h-5 mr-3 text-content-muted" />
                                  <div>
                                    <div className="text-content font-medium text-start">macOS (Apple Silicon)</div>
                                    <div className="text-content-ash text-xs">For M1, M2, M3, M4 Macs</div>
                                  </div>
                                </div>
                                <DownloadRowArrow />
                              </div>
                            </a>
                          )}
                        </Menu.Item>

                        <Menu.Item>
                          {({ active }) => (
                            <a
                              href="https://api.enconvo.com/app/download?arch=x64&platform=darwin"
                              target="_blank"
                              rel="noreferrer"
                              className={`${active ? 'bg-surface-card' : ''} group flex items-center w-full px-4 py-3 text-sm font-medium text-content rounded-lg transition-colors`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center">
                                  <AppleLogoIcon className="w-5 h-5 mr-3 text-content-muted" />
                                  <div>
                                    <div className="text-content font-medium text-start">macOS (Intel)</div>
                                    <div className="text-content-ash text-xs">For Intel-based Macs</div>
                                  </div>
                                </div>
                                <DownloadRowArrow />
                              </div>
                            </a>
                          )}
                        </Menu.Item>
                      </div>
                    </div>
                  </Menu.Items>
                </Menu>

                <div className="flex items-center space-x-6 text-sm text-content-muted">
                  <span>macOS 14+ (Intel &amp; Apple Silicon)</span>
                </div>
              </div>
            </div>

            <HeroShowcase />
          </div>
        </div>
      </div>
    </div>
  )
}
