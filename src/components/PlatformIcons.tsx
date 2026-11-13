// Monochrome platform marks for download menus and cards, drawn in currentColor.

export function AppleLogoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  )
}

export function WindowsLogoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 3h8.5v8.5H3zM12.5 3H21v8.5h-8.5zM3 12.5h8.5V21H3zM12.5 12.5H21V21h-8.5z" />
    </svg>
  )
}

export function LinuxLogoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M12 2c-2.5 0-4 2-4 4.5v2.2C6.6 10.3 5 12.6 5 15.2c0 1.7.6 3.1 1.6 4.1L5 21.2c-.3.4 0 .8.4.8h4.2c.4 0 .7-.2.8-.5l.3-.6h2.6l.3.6c.1.3.4.5.8.5h4.2c.4 0 .7-.4.4-.8l-1.6-1.9c1-1 1.6-2.4 1.6-4.1 0-2.6-1.6-4.9-3-6.5V6.5C16 4 14.5 2 12 2zm0 8.5c-1.9 0-3.5 2-3.5 4.5s1.6 4 3.5 4 3.5-1.5 3.5-4-1.6-4.5-3.5-4.5zM10.5 5.2a.8.8 0 100 1.6.8.8 0 000-1.6zm3 0a.8.8 0 100 1.6.8.8 0 000-1.6z"
      />
    </svg>
  )
}
