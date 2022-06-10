import { useBridgeConfig } from '@avalabs/bridge-sdk'
import * as bitcoin from 'bitcoinjs-lib'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { BTCTransactionResponse } from 'screens/bridge/handlers/createBridgeTransaction'
import { useActiveAccount } from 'hooks/useActiveAccount'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import networkService from 'services/network/NetworkService'
import walletService from 'services/wallet/WalletService'
import balanceService from 'services/balance/BalanceService'
import { BITCOIN_NETWORK, BITCOIN_TEST_NETWORK } from '@avalabs/chains-sdk'

//fixme - no more issueRawTx, signPsbt in bridge-sdk
export default function useSignAndIssueBtcTx() {
  const config = useBridgeConfig().config
  const activeAccount = useActiveAccount()
  const { isDeveloperMode } = useActiveNetwork()
  const bitcoinNetwork = isDeveloperMode
    ? BITCOIN_TEST_NETWORK
    : BITCOIN_NETWORK



  async function signAndIssueBtcTx(unsignedHex: string) {
    if (!config || !activeAccount) {
      return Promise.reject('Wallet not ready')
    }
    const psbt = bitcoin.Psbt.fromHex(unsignedHex)
    psbt
    // const signedTx = signPsbt(
    //   walletService.getEvmWallet(activeAccount.index, activeNetwork).privateKey,
    //   psbt
    // ).extractTransaction()

    // return await issueRawTx(signedTx.toHex(), config)
    return {} as BTCTransactionResponse
  }

  return { signAndIssueBtcTx }
}
