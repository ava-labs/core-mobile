import { JsonRpcError } from '@metamask/rpc-errors'

export const getJsonRpcErrorMessage = (error: unknown): string => {
  if (error instanceof JsonRpcError) {
    return `${error.message}${error.data.cause ? '.\n' + error.data.cause : ''}`
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unexpected error'
}
