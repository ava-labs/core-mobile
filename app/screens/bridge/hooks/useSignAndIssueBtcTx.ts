import { issueRawTx, signPsbt, useBridgeConfig } from '@avalabs/bridge-sdk'
import { useWalletContext } from '@avalabs/wallet-react-components'
import * as bitcoin from 'bitcoinjs-lib'
import { MnemonicWallet } from '@avalabs/avalanche-wallet-sdk'

export default function useSignAndIssueBtcTx() {
  const config = useBridgeConfig().config
  const wallet = useWalletContext().wallet as MnemonicWallet

  async function signAndIssueBtcTx(unsignedHex: string) {
    if (!config || !wallet) {
      return Promise.reject('Wallet not ready')
    }
    const psbt = bitcoin.Psbt.fromHex(unsignedHex)
    const signedTx = signPsbt(
      wallet?.evmWallet?.getPrivateKeyHex(),
      psbt
    ).extractTransaction()

    return await issueRawTx(signedTx.toHex(), config)
  }

  return { signAndIssueBtcTx }
}
