import { networkIDs, utils, Utxo } from '@avalabs/avalanchejs'
import { XPAddressDictionary } from 'store/account'

const getHrp = (isTestnet: boolean): string =>
  isTestnet ? networkIDs.FujiHRP : networkIDs.MainnetHRP

/**
 * Formats an `avax…` or `fuji…` style Avalanche address for the correct network.
 * This will throw errors for `['C-', 'X-', 'P-']` prefixed addresses.
 */
const formatAvalancheAddress = (
  addressString: string,
  isTestnet: boolean
): string => {
  const [, bytes] = utils.parseBech32(addressString)
  const hrp = getHrp(isTestnet)

  // Safe cast because otherwise the parse above would throw.
  return utils.formatBech32(hrp, bytes)
}

/**
 * Normalizes the xpAddressDict keys to the current network's HRP.
 * This handles the case where the dictionary was created on a different network
 * (e.g., keys are 'fuji1...' but we're looking up 'avax1...' addresses or vice versa).
 */
const normalizeXpAddressDict = (
  xpAddressDict: XPAddressDictionary,
  isTestnet: boolean
): XPAddressDictionary => {
  const normalized: XPAddressDictionary = {}

  for (const [address, data] of Object.entries(xpAddressDict)) {
    try {
      const normalizedAddress = formatAvalancheAddress(address, isTestnet)
      normalized[normalizedAddress] = data
    } catch {
      // If we can't parse the address (e.g., it's not a valid bech32),
      // keep it as-is for backward compatibility
      normalized[address] = data
    }
  }

  return normalized
}

export const getInternalExternalAddrs = ({
  utxos,
  xpAddressDict,
  isTestnet
}: {
  utxos: readonly Utxo[]
  xpAddressDict: XPAddressDictionary
  isTestnet: boolean
}): {
  externalIndices: number[]
  internalIndices: number[]
} => {
  // Normalize dictionary keys to match the current network's HRP
  const normalizedDict = normalizeXpAddressDict(xpAddressDict, isTestnet)

  const utxosAddrs = new Set<string>(
    utxos.flatMap(utxo =>
      utxo
        .getOutputOwners()
        .addrs.map(String)
        .map(addressString => formatAvalancheAddress(addressString, isTestnet))
    )
  )

  return [...utxosAddrs].reduce(
    (accumulator, address) => {
      // This can happen when the CoreEth address owns a UTXO.
      const xpAddressDictElement = normalizedDict[address]
      if (xpAddressDictElement === undefined) {
        return accumulator
      }
      const { space, index } = xpAddressDictElement

      return {
        internalIndices: [
          ...accumulator.internalIndices,
          ...(space === 'i' ? [index] : [])
        ],
        externalIndices: [
          ...accumulator.externalIndices,
          ...(space === 'e' ? [index] : [])
        ]
      }
    },
    {
      externalIndices: [] as number[],
      internalIndices: [] as number[]
    }
  )
}
