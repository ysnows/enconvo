import assert from 'node:assert/strict'
import { fork } from 'node:child_process'
import { once } from 'node:events'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const workerPath = require.resolve('next/dist/compiled/jest-worker/processChild.js')
const guardPath = fileURLToPath(new URL('./next-worker-lifecycle.cjs', import.meta.url))
const env = {
  ...process.env,
  NODE_OPTIONS: [
    process.env.NODE_OPTIONS,
    existsSync(guardPath) ? `--require=${JSON.stringify(guardPath)}` : '',
  ].filter(Boolean).join(' '),
}

function isAlive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    if (error.code === 'ESRCH') return false
    throw error
  }
}

async function waitForExit(pid) {
  for (let attempt = 0; attempt < 50; attempt++) {
    if (!isAlive(pid)) return
    await delay(100)
  }
  assert.fail(`Next.js worker ${pid} survived the loss of its parent IPC channel`)
}

function initialize(worker, fixture) {
  worker.send([0, false, fixture, []])
  worker.send([1, false, 'hold', []])
}

test('Next.js workers stay usable while connected and exit on disconnect', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'next-worker-lifecycle-'))
  const fixture = path.join(dir, 'worker.cjs')
  writeFileSync(fixture, 'exports.hold = () => { setInterval(() => {}, 1000); return process.pid }')
  const worker = fork(workerPath, [], { env, execArgv: [], stdio: ['ignore', 'ignore', 'ignore', 'ipc'] })
  try {
    const ready = once(worker, 'message')
    initialize(worker, fixture)
    const [[type, pid]] = await ready
    assert.equal(type, 0)
    assert.equal(pid, worker.pid)
    assert.equal(worker.connected, true)
    assert.equal(isAlive(pid), true)
    worker.disconnect()
    await waitForExit(pid)
  } finally {
    if (isAlive(worker.pid)) worker.kill('SIGKILL')
    rmSync(dir, { recursive: true, force: true })
  }
})

test('Next.js workers exit when their parent is killed abruptly', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'next-worker-parent-'))
  const fixture = path.join(dir, 'worker.cjs')
  const parentPath = path.join(dir, 'parent.cjs')
  writeFileSync(fixture, 'exports.hold = () => { setInterval(() => {}, 1000); return process.pid }')
  writeFileSync(parentPath, `
    const { fork } = require('node:child_process')
    const worker = fork(${JSON.stringify(workerPath)}, [], {
      execArgv: [], stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
    })
    worker.once('message', () => process.send(worker.pid))
    worker.send([0, false, ${JSON.stringify(fixture)}, []])
    worker.send([1, false, 'hold', []])
  `)
  const parent = fork(parentPath, [], { env, execArgv: [], stdio: ['ignore', 'ignore', 'ignore', 'ipc'] })
  let workerPid
  try {
    ;[workerPid] = await once(parent, 'message')
    assert.equal(isAlive(workerPid), true)
    const exited = once(parent, 'exit')
    parent.kill('SIGKILL')
    await exited
    await waitForExit(workerPid)
  } finally {
    if (isAlive(parent.pid)) parent.kill('SIGKILL')
    if (workerPid && isAlive(workerPid)) process.kill(workerPid, 'SIGKILL')
    rmSync(dir, { recursive: true, force: true })
  }
})
