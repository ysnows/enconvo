import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'

const LOCAL_API = 'http://localhost:54535'

interface DecodedConfig {
  command?: string
  args?: string[]
  env?: Record<string, string>
  url?: string
  headers?: Record<string, string>
}

function decodeConfig(b64: string): DecodedConfig | null {
  try {
    return JSON.parse(atob(b64))
  } catch {
    return null
  }
}

type InstallState = 'idle' | 'installing' | 'success' | 'error'

export default function MCPInstall() {
  const router = useRouter()
  const { name, config } = router.query as { name?: string; config?: string }
  const [state, setState] = useState<InstallState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const decoded = useMemo(() => (config ? decodeConfig(config) : null), [config])
  const transport = decoded?.command ? 'stdio' : 'http'

  const handleInstall = async () => {
    if (!name || !config) return

    setState('installing')

    window.open(`enconvo://mcp/install?name=${encodeURIComponent(name)}&config=${encodeURIComponent(config)}`, '_self')

    await new Promise(r => setTimeout(r, 500))

    try {
      const resp = await fetch(`${LOCAL_API}/mcp/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, config }),
      })
      const data = await resp.json()
      if (data.success) {
        setState('success')
      } else {
        setState('error')
        setErrorMsg(data.error || 'Install failed')
      }
    } catch {
      setState('error')
      setErrorMsg('Could not connect to Enconvo. Make sure the app is running.')
    }
  }

  if (!router.isReady) return null

  if (!name || !config || !decoded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Invalid Install Link</h1>
          <p className="mt-2 text-gray-600">Missing server name or configuration.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Install {name} — Enconvo MCP</title>
        <meta name="description" content={`Add the ${name} MCP server to Enconvo`} />
      </Head>

      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <img src="/favicon.ico" alt="Enconvo" className="h-10 w-10 rounded-lg" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Add MCP Server</h1>
              <p className="text-sm text-gray-500">to Enconvo</p>
            </div>
          </div>

          {/* Server info */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-base font-medium text-gray-900">{name}</span>
              <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                {transport}
              </span>
            </div>

            {transport === 'stdio' && decoded.command && (
              <div className="space-y-1.5 text-sm">
                <div>
                  <span className="text-gray-500">Command: </span>
                  <code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-800">
                    {decoded.command} {decoded.args?.join(' ')}
                  </code>
                </div>
                {decoded.env && Object.keys(decoded.env).length > 0 && (
                  <div>
                    <span className="text-gray-500">Environment: </span>
                    <span className="text-gray-700">{Object.keys(decoded.env).join(', ')}</span>
                  </div>
                )}
              </div>
            )}

            {transport === 'http' && decoded.url && (
              <div className="text-sm">
                <span className="text-gray-500">URL: </span>
                <code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-800 break-all">
                  {decoded.url}
                </code>
              </div>
            )}
          </div>

          {/* Action */}
          {state === 'idle' && (
            <button
              onClick={handleInstall}
              className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            >
              Add to Enconvo
            </button>
          )}

          {state === 'installing' && (
            <button disabled className="w-full rounded-lg bg-gray-400 px-4 py-2.5 text-sm font-medium text-white cursor-not-allowed">
              Installing...
            </button>
          )}

          {state === 'success' && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center">
              <p className="text-sm font-medium text-green-800">
                {name} has been added to Enconvo
              </p>
              <p className="text-xs text-green-600 mt-1">
                Check the MCP Servers settings pane in Enconvo.
              </p>
            </div>
          )}

          {state === 'error' && (
            <div>
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-center mb-3">
                <p className="text-sm text-red-700">{errorMsg}</p>
              </div>
              <button
                onClick={handleInstall}
                className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          <p className="mt-4 text-center text-xs text-gray-400">
            Don&apos;t have Enconvo?{' '}
            <a href="https://enconvo.com" className="text-gray-600 underline">
              Download
            </a>
          </p>
        </div>
      </div>
    </>
  )
}
