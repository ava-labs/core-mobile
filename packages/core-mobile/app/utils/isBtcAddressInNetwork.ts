import {
  isBase58AddressInNetwork,
  isBech32AddressInNetwork
} from '@avalabs/bridge-sdk'

/**
 * Check if the given address is a valid Bitcoin address
 * @param address Bitcoin address, bech32 or b58
 * @param isMainnet Verify address against mainnet or testnet
 */
export function isBtcAddressInNetwork(
  address: string,
  isMainnet: boolean
): boolean {
  return (
    isBech32AddressInNetwork(address, isMainnet) ||
    isBase58AddressInNetwork(address, isMainnet)
  )
}
