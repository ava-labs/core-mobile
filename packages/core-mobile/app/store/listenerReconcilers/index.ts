import { ListenerReconcilerExecutor } from './executor'
import { Reconciler } from './types'
import { validateRegistry } from './utils'

/**
 * Registry of all listener reconcilers. Add new reconcilers here. They
 * run in registration order on every `onAppUnlocked`.
 *
 * Reconcilers are recurring and idempotent — each one is responsible for
 * its own short-circuit / no-op check (read state → return `noOp` if no
 * work needed).
 */
export const listenerReconcilers: Reconciler[] = []

validateRegistry(listenerReconcilers)

/**
 * App-wide singleton. Used from the `onAppUnlocked` integration to run
 * the full reconciler chain on every unlock.
 */
export const listenerReconcilerExecutor = new ListenerReconcilerExecutor(
  listenerReconcilers
)
