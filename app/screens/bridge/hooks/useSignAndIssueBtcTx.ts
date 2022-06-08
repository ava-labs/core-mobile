import { issueRawTx, signPsbt, useBridgeConfig } from '@avalabs/bridge-sdk'
import * as bitcoin from 'bitcoinjs-lib'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import walletService from 'services/wallet/WalletService'
import { selectActiveAccount } from 'store/account'

export default function useSignAndIssueBtcTx() {
  const config = useBridgeConfig().config
  const activeAccount = useSelector(selectActiveAccount)
  const activeNetwork = useSelector(selectActiveNetwork)

  async function signAndIssueBtcTx(unsignedHex: string) {
    if (!config || !activeAccount) {
      return Promise.reject('Wallet not ready')
    }
    const psbt = bitcoin.Psbt.fromHex(unsignedHex)
    const signedTx = signPsbt(
      walletService.getEvmWallet(activeAccount.index, activeNetwork).privateKey,
      psbt
    ).extractTransaction()

    return await issueRawTx(signedTx.toHex(), config)
  }

  return { signAndIssueBtcTx }
}
