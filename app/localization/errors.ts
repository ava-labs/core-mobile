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
    errorString.startsWith('Not enough') &&
    errorString.includes('allowance')
  ) {
    return 'Swap failed! Not enough allowance.'
  }
  if (errorString.includes('-32000')) {
    return 'Swap failed! Another transaction is pending. Rise gas price to overwrite it.'
  }
  return 'Swap failed! Please try again.'
}
