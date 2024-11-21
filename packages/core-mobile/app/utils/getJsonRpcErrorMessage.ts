import { JsonRpcError } from '@metamask/rpc-errors'

export const getJsonRpcErrorMessage = (error: unknown): string => {
  if (error instanceof JsonRpcError) {
    return `${error.message}${
      error.data?.cause?.message
        ? '\n' + `Error: ${error.data.cause.message}`
        : ''
    }`
  }

  if (error instanceof Error) {
    // some errors have a `details` property that contains a more detailed and user friendly error message
    // (i.e. BridgeError object thrown by the @avalabs/bridge-unified)
    if ('details' in error && typeof error.details === 'string') {
      return error.details
    }

    return error.message
  }

  return 'Unexpected error'
}
