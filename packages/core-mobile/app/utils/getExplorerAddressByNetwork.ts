export function getExplorerAddressByNetwork(
  explorerUrl: string,
  hash?: string,
  hashType?: 'account' | 'tx'
): string {
  try {
    // Try to respect any query params set on {explorerUrl}
    const baseUrl = new URL(explorerUrl)
    if (hash && hashType) {
      baseUrl.pathname += `/${hashType}/${hash}`
    }

    return baseUrl.toString()
  } catch {
    return `${explorerUrl}/${hashType}/${hash}`
  }
}
