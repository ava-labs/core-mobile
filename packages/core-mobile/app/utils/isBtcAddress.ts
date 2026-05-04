import { address as bitcoinAddress, networks } from 'bitcoinjs-lib'

export function isBech32Address(btcAddress: string): boolean {
  try {
    bitcoinAddress.fromBech32(btcAddress)
    return true
  } catch {
    return false
  }
}

function isBech32AddressInNetwork(
  btcAddress: string,
  isMainnet: boolean
): boolean {
  if (!isBech32Address(btcAddress)) return false
  return btcAddress.toLowerCase().startsWith(isMainnet ? 'bc' : 'tb')
}

function isBase58Address(addr: string): boolean {
  try {
    bitcoinAddress.fromBase58Check(addr)
    return true
  } catch {
    return false
  }
}

function isBase58AddressInNetwork(addr: string, isMainnet: boolean): boolean {
  if (!isBase58Address(addr)) return false
  const network = isMainnet ? networks.bitcoin : networks.testnet
  try {
    bitcoinAddress.toOutputScript(addr, network)
    return true
  } catch {
    return false
  }
}

/**
 * Check if the given address is a valid Bitcoin address
 * @param address Bitcoin address, bech32 or b58
 * @param isMainnet Verify address against mainnet or testnet
 */
export function isBtcAddress(address: string, isMainnet: boolean): boolean {
  return (
    isBech32AddressInNetwork(address, isMainnet) ||
    isBase58AddressInNetwork(address, isMainnet)
  )
}
