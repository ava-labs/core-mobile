import { BitcoinInputUTXO, BitcoinProvider } from '@avalabs/core-wallets-sdk'
import { TokenWithBalanceBTC } from '@avalabs/vm-module-types'
// @ts-ignore
import { inputBytes } from 'coinselect/utils'

export const getBtcInputUtxos = async (
  provider: BitcoinProvider,
  token: TokenWithBalanceBTC,
  feeRate: number
): Promise<BitcoinInputUTXO[]> => {
  const utxos = await provider.getScriptsForUtxos(token.utxos ?? [])

  // Filter out UTXOs that would not be used with the current fee rate,
  // that is those for which fee to use the UTXO would be higher than its value.
  return utxos.filter(utxo => {
    const utxoFee = inputBytes(utxo) * feeRate

    return utxoFee < utxo.value
  })
}
