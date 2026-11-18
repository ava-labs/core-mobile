export function getExplorerAddressByNetwork(
  explorerUrl: string,
  hash?: string,
  hashType?: 'account' | 'address' | 'tx'
): string {
  try {
    // Try to respect any query params set on {explorerUrl}
    const baseUrl = new URL(explorerUrl)
    if (hash && hashType) {
      // Drop trailing slashes so a bare origin ("https://etherscan.io", whose
      // pathname is "/") does not produce a double slash.
      baseUrl.pathname = `${baseUrl.pathname.replace(
        /\/+$/,
        ''
      )}/${hashType}/${hash}`
    }

    return baseUrl.toString()
  } catch {
    return `${explorerUrl}/${hashType}/${hash}`
  }
}
