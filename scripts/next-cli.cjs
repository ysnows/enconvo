const path = require('node:path')

// NODE_OPTIONS also reaches Next's forked workers, even when execArgv is reset.
// Keep any options supplied by the developer or CI runner.
const guardPath = path.join(__dirname, 'next-worker-lifecycle.cjs')
process.env.NODE_OPTIONS = [
  process.env.NODE_OPTIONS,
  `--require=${JSON.stringify(guardPath)}`,
].filter(Boolean).join(' ')

require('next/dist/bin/next')
