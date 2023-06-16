import { ChainId } from '@avalabs/chains-sdk'
import { assertNotUndefined } from 'utils/assertions'
import { Avalanche } from '@avalabs/wallets-sdk'
import { exponentialBackoff } from 'utils/js/exponentialBackoff'
import Logger from 'utils/Logger'
import { ExportCParams } from 'services/wallet/types'
import { calculatePChainFee } from 'services/wallet/calculateCrossChainFees'

export async function exportC({
  requiredAmount,
  walletService,
  networkService,
  activeAccount,
  isDevMode
}: ExportCParams): Promise<boolean> {
  const avaxXPNetwork = networkService.getAvalancheNetworkXP(isDevMode)
  const chains = await networkService.getNetworks()
  const cChainNetwork =
    chains[
      isDevMode ? ChainId.AVALANCHE_TESTNET_ID : ChainId.AVALANCHE_MAINNET_ID
    ]
  assertNotUndefined(cChainNetwork)

  const wallet = (await walletService.getWallet(
    activeAccount.index,
    avaxXPNetwork
  )) as Avalanche.StaticSigner

  const amt = BigInt(requiredAmount.toString(10))
  const nonce = await wallet.getNonce()
  const baseFee = BigInt(29e9) // 29 nAVAX in WEI for instant speed

  const pChainFee = calculatePChainFee()

  const amount = amt + BigInt(pChainFee.toString())
  Logger.trace('amount', amount)
  const unsignedTxWithFee = wallet.exportC(
    amount,
    'P',
    BigInt(nonce),
    baseFee,
    activeAccount.addressPVM
  )
  const signedTxWithFee = (
    await wallet.signTx({
      tx: unsignedTxWithFee
    })
  ).getSignedTx()

  const txID = await networkService.sendTransaction(
    signedTxWithFee,
    avaxXPNetwork,
    true
  )
  Logger.trace('txID', txID)

  const avaxProvider = networkService.getProviderForNetwork(
    avaxXPNetwork
  ) as Avalanche.JsonRpcProvider

  try {
    await exponentialBackoff(
      () => avaxProvider.getApiC().getAtomicTxStatus(txID),
      result => result.status === 'Accepted',
      5
    )
  } catch (e) {
    Logger.error('exponentialBackoff failed', e)
    return false
  }

  return true
}
