import { Utxo, VM, utils } from '@avalabs/avalanchejs'

export const getProvidedUtxos = ({
  utxoHexes = [],
  vm
}: {
  utxoHexes?: string[]
  vm: VM
}): Utxo[] => {
  try {
    const codec = utils.getManagerForVM(vm).getDefaultCodec()
    return utxoHexes.map(utxoHex => {
      const utxoBytes = utils.hexToBuffer(utxoHex)
      return Utxo.fromBytes(utxoBytes, codec)[0]
    })
  } catch (err) {
    return []
  }
}
