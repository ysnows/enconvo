import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'

function decodeConfig(b64: string): Record<string, unknown> | null {
  try {
    return JSON.parse(atob(b64))
  } catch {
    return null
  }
}

export default function MCPInstall() {
  const router = useRouter()
  const { name, config } = router.query as { name?: string; config?: string }
  const [copied, setCopied] = useState(false)

  const decoded = useMemo(() => (config ? decodeConfig(config) : null), [config])

  const fullConfig = useMemo(() => {
    if (!name || !decoded) return null
    return { [name]: decoded }
  }, [name, decoded])

  const configJson = useMemo(
    () => (fullConfig ? JSON.stringify(fullConfig, null, 2) : ''),
    [fullConfig]
  )

  useEffect(() => {
    if (!name || !config) return
    window.location.href = `enconvo://mcp/install?name=${encodeURIComponent(name)}&config=${encodeURIComponent(config)}`
  }, [name, config])

  const handleCopy = async () => {
    if (!configJson) return
    await navigator.clipboard.writeText(configJson)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!router.isReady) return null

  if (!name || !config || !decoded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
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

      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
        <div className="w-full max-w-xl text-center">
          <h1 className="text-2xl font-bold text-gray-900">Launched Enconvo</h1>
          <p className="mt-2 text-base text-gray-600">
            MCP server installation should be starting in Enconvo.
          </p>

          <p className="mt-8 text-sm text-gray-400">
            If Enconvo didn&apos;t open automatically, you can manually add the MCP server with the configuration below:
          </p>

          <div className="mt-4 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">MCP Server Configuration:</span>
              <button
                onClick={handleCopy}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy to clipboard"
              >
                {copied ? (
                  <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
            <pre className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800 overflow-x-auto">
              {configJson}
            </pre>
          </div>

          <p className="mt-8 text-xs text-gray-400">
            Don&apos;t have Enconvo?{' '}
            <a href="https://enconvo.com" className="text-gray-600 underline hover:text-gray-800">
              Download
            </a>
          </p>
        </div>
      </div>
    </>
  )
}
