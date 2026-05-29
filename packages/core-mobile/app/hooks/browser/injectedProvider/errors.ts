/** EIP-1193: user rejected the request (connect/sign cancel, etc.). */
export const EIP1193_USER_REJECTED_CODE = 4001

/** JSON-RPC 2.0 internal error. */
export const JSON_RPC_INTERNAL_ERROR_CODE = -32603

/** JSON-RPC resource unavailable (request already pending). */
export const JSON_RPC_RESOURCE_UNAVAILABLE_CODE = -32002

export const USER_REJECTED_REQUEST_MESSAGE = 'User rejected the request.'
export const CONNECT_PROMPT_TIMED_OUT_MESSAGE = 'Connect prompt timed out'
export const BRIDGE_UNAVAILABLE_MESSAGE = 'Bridge unavailable'

export function isUserRejectedRpcError(err: unknown): boolean {
  return (err as { code?: number })?.code === EIP1193_USER_REJECTED_CODE
}
