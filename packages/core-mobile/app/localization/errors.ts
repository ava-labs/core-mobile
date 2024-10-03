import { JsonRpcError } from '@metamask/rpc-errors'
import { isError } from 'ethers'

type ObjWithError = { error: string }

const isObjWithError = (error: unknown): error is ObjWithError =>
  Boolean(typeof error === 'object' && error && 'error' in error)

export function humanizeSwapErrors(err: unknown): string {
  let errorString = ''
  if (isObjWithError(err)) {
    errorString = err.error
  } else if (typeof err === 'string') {
    errorString = err
  }

  if (
    errorString.toLowerCase().startsWith('not enough') &&
    errorString.includes('allowance')
  ) {
    return 'Swap failed! Not enough allowance.'
  }
  if (errorString.includes('-32000')) {
    return 'Swap failed! Another transaction is pending. Rise gas price to overwrite it.'
  }
  if (errorString.toLowerCase().includes('network error')) {
    return 'Swap failed! Network error, please try again.'
  }
  if (err instanceof JsonRpcError && isError(err.cause, 'INSUFFICIENT_FUNDS')) {
    return `Swap failed! Insufficient amount for gas. Reduce swap quantity and try again.`
  }
  return 'Swap failed! Please try again.'
}
