export function humanizeSwapErrors(err: unknown): string {
  let errorString = ''
  if (typeof err === 'object' && err && 'error' in err) {
    errorString = (err as { error: string }).error
  } else if (typeof err === 'string') {
    errorString = err
  }

  if (
    errorString.startsWith('Not enough') &&
    errorString.includes('allowance')
  ) {
    return 'Swap failed: not enough allowance.'
  }
  if (errorString.includes('-32000')) {
    return 'Swap failed: transaction nonce is out of sync. Are you using same wallet on different apps?'
  }
  return 'Swap failed: unknown reason'
}
