import { networkIDs, utils, Utxo } from '@avalabs/avalanchejs'

type SearchSpace = 'i' | 'e'
type XPAddressData = { index: number; space: SearchSpace }
type XPAddressDictionary = Record<string, XPAddressData>

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
      const xpAddressDictElement = xpAddressDict[address]
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
