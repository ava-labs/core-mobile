/**
 * Sanitizes RPC params before they reach the evm-module Zod validator.
 *
 * Some dapps (e.g. Snowscan) send `null` for optional transaction fields like
 * `maxFeePerGas` and `maxPriorityFeePerGas`. The evm-module schema accepts
 * `string | undefined` but rejects `null`, causing a ZodError.
 *
 * This function converts `null` values in transaction objects to `undefined`
 * so the module can estimate gas fees itself — matching MetaMask behaviour.
 *
 * Intentionally shallow: only sanitizes top-level properties of objects in the
 * array. Nested objects (e.g. accessList entries) are passed through as-is,
 * since the evm-module schema only has flat optional string fields at the top level.
 */
export function sanitizeRpcParams(params: unknown): unknown {
  if (!Array.isArray(params)) return params

  return params.map(item => {
    if (item === null || typeof item !== 'object') return item

    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(
      item as Record<string, unknown>
    )) {
      sanitized[key] = value === null ? undefined : value
    }
    return sanitized
  })
}
