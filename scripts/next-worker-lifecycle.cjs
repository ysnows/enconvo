// Next.js 13's jest workers can retain timers after their owner exits.
// Once IPC is gone, they cannot receive jobs or report results anymore.
const isNextWorker = /[\\/]next[\\/]dist[\\/]compiled[\\/]jest-worker[\\/]processChild\.js$/.test(
  process.argv[1] || ''
)

if (isNextWorker && typeof process.send === 'function') {
  process.once('disconnect', () => process.exit(0))
  if (!process.connected) process.exit(0)
}
