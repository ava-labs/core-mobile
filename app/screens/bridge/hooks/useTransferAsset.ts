import {
  Asset,
  Blockchain,
  useBridgeSDK,
  useTransferAsset as useTransferAssetSDK
} from '@avalabs/bridge-sdk'
import {
  MAINNET_NETWORK,
  useNetworkContext,
  useWalletContext,
  useWalletStateContext
} from '@avalabs/wallet-react-components'
import {getAvalancheProvider} from 'screens/bridge/utils/getAvalancheProvider'
import {getEthereumProvider} from 'screens/bridge/utils/getEthereumProvider'
import {WalletType} from '@avalabs/avalanche-wallet-sdk'
import Common, {Chain} from '@ethereumjs/common'

import {TransactionRequest} from '@ethersproject/abstract-provider'
import {Transaction, TxData} from '@ethereumjs/tx'
import {makeBNLike} from 'utils/Utils'
import {BufferLike} from 'ethereumjs-util'

/**
 * prepares asset to be transfered by check creating a TransactionRequest, signing with wallet.signEvm;
 * @param asset
 */
export function useTransferAsset(asset: Asset | undefined) {
  // @ts-ignore addresses exist in walletContext
  const {addresses} = useWalletStateContext()
  const network = useNetworkContext()?.network
  const wallet = useWalletContext().wallet
  const {currentBlockchain} = useBridgeSDK()

  const account = addresses.addrC
  // Use the wallet provider for the current blockchain so transactions can be signed
  const avalanche = getAvalancheProvider(network)
  const ethereum = getEthereumProvider(network)

  const isMainnet = network?.chainId === MAINNET_NETWORK.chainId

  const common =
    currentBlockchain === Blockchain.AVALANCHE
      ? Common.custom({
          networkId: network?.config.networkID,
          chainId: parseInt(network?.chainId ?? '')
        })
      : new Common({
          chain: isMainnet ? Chain.Mainnet : Chain.Rinkeby
        })

  return useTransferAssetSDK(
    asset,
    account,
    avalanche,
    ethereum,
    (txData: TransactionRequest) => signTransaction(wallet, common, txData)
  )
}

async function signTransaction(
  wallet: WalletType,
  common: Common,
  txData: TransactionRequest
): Promise<string> {
  const tx = Transaction.fromTxData(convertTxData(txData), {
    common: common as any /* fix "private property '_chainParams'" conflict */
  })
  const signedTx = await wallet.signEvm(tx)
  const txHex = '0x' + signedTx.serialize().toString('hex')
  return txHex
}

/**
 * Convert tx data from `TransactionRequest` (ethers) to `TxData` (@ethereumjs)
 */
function convertTxData(txData: TransactionRequest): TxData {
  return {
    to: txData.to,
    nonce: makeBNLike(txData.nonce),
    gasPrice: makeBNLike(txData.gasPrice),
    gasLimit: makeBNLike(txData.gasLimit),
    value: makeBNLike(txData.value),
    data: txData.data as BufferLike,
    type: txData.type
  }
}
