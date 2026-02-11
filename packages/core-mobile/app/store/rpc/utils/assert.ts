import { rpcErrors } from '@metamask/rpc-errors'

/**
 * RPC assertion function
 * Throws an RPC internal error if the value is falsy
 *
 * @param value - The value to check
 * @param message - Optional error message
 * @throws RPC internal error if value is falsy
 */
export function assert(
  value: unknown,
  message?: string
): asserts value is NonNullable<unknown> {
  if (!value) {
    throw rpcErrors.internal({
      data: { reason: message || 'Assertion failed' }
    })
  }
}
