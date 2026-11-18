import { getExplorerAddressByNetwork } from 'utils/getExplorerAddressByNetwork'

/**
 * Builds the block-explorer URL for an address on a network, or undefined if
 * the network has no explorer (e.g. a custom network without one) or the
 * configured explorer is not an http(s) URL.
 */
export const getAddressExplorerUrl = (
  explorerUrl: string | undefined,
  address: string | undefined
): string | undefined => {
  if (!explorerUrl || !address) return undefined

  try {
    const { protocol } = new URL(explorerUrl)
    if (protocol !== 'https:' && protocol !== 'http:') return undefined
  } catch {
    return undefined
  }

  return getExplorerAddressByNetwork(explorerUrl, address, 'address')
}
