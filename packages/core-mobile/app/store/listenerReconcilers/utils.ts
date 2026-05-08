import { Reconciler } from './types'

/**
 * Throws if a single reconciler is missing a required field. Called for
 * each entry in the registry by `validateRegistry`.
 */
const assertValidShape = (r: Reconciler): void => {
  if (!r.name) {
    throw new Error(`[listenerReconcilers] reconciler is missing a name`)
  }
  if (!r.description) {
    throw new Error(
      `[listenerReconcilers] reconciler "${r.name}" is missing a description`
    )
  }
  if (typeof r.reconcile !== 'function') {
    throw new Error(
      `[listenerReconcilers] reconciler "${r.name}" is missing a reconcile function`
    )
  }
}

/**
 * Validates the registry at module load. Throws on a malformed reconciler
 * or two reconcilers sharing a name. Crashing at import is intentional —
 * a malformed registry is a programming error that must be caught before
 * the app boots.
 */
export const validateRegistry = (reconcilers: Reconciler[]): void => {
  const seenNames = new Set<string>()

  for (const reconciler of reconcilers) {
    assertValidShape(reconciler)

    if (seenNames.has(reconciler.name)) {
      throw new Error(
        `[listenerReconcilers] duplicate reconciler name: ${reconciler.name}`
      )
    }
    seenNames.add(reconciler.name)
  }
}
