import { BitcoinInputUTXO, BitcoinProvider } from '@avalabs/core-wallets-sdk'
// @ts-ignore
import { inputBytes } from 'coinselect/utils'

export const getBtcInputUtxos = async (
  provider: BitcoinProvider,
  address: string,
  feeRate: number
): Promise<BitcoinInputUTXO[]> => {
  const { utxos } = await provider.getUtxoBalance(address, true)

  // Filter out UTXOs that would not be used with the current fee rate,
  // that is those for which fee to use the UTXO would be higher than its value.
  return (utxos as BitcoinInputUTXO[]).filter(utxo => {
    const utxoFee = inputBytes(utxo) * feeRate

    return utxoFee < utxo.value
  })
}
