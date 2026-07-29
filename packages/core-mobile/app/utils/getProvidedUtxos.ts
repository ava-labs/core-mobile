import { Utxo, VM, utils } from '@avalabs/avalanchejs'

export const getProvidedUtxos = ({
  utxoHexes = [],
  vm
}: {
  utxoHexes?: string[]
  vm: VM
}): Utxo[] => {
  const codec = utils.getManagerForVM(vm).getDefaultCodec()
  return utxoHexes.map(utxoHex => {
    let utxo: Utxo | undefined
    try {
      const utxoBytes = utils.hexToBuffer(utxoHex)
      utxo = Utxo.fromBytes(utxoBytes, codec)[0]
    } catch (err) {
      throw new Error(
        `Failed to decode provided UTXO: ${
          err instanceof Error ? err.message : String(err)
        }`
      )
    }
    if (!utxo) {
      throw new Error('Failed to decode provided UTXO: empty result')
    }
    return utxo
  })
}
