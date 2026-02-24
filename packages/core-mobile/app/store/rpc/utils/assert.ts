import { rpcErrors } from '@metamask/rpc-errors'

/**
 * RPC assertion function
 * Throws an RPC internal error if the value is falsy
 *
 * @param value - The value to check
 * @param message - Optional error message
 * @throws RPC internal error if value is falsy
 * @example
 *   const foo: string | null = getValue()
 *   assert(foo, 'foo is required')
 *   // foo is now typed as string (non-nullable)
 */
export function assert<T>(
  value: T,
  message?: string
): asserts value is NonNullable<T> {
  if (!value) {
    throw rpcErrors.internal({
      data: { reason: message || 'Assertion failed' }
    })
  }
}
