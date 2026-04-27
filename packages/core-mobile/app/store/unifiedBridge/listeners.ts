import { bigIntToHex } from '@ethereumjs/util'
import { AppListenerEffectAPI, AppStartListening, RootState } from 'store/types'
import { WalletState } from 'store/app/types'
import { onAppUnlocked, selectWalletState } from 'store/app/slice'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced/slice'
import { isAnyOf } from '@reduxjs/toolkit'
import UnifiedBridgeService from 'services/bridge/UnifiedBridgeService'
import {
  BridgeTransfer,
  BridgeType,
  BtcSigner,
  Environment,
  EvmSigner,
  Hex
} from '@avalabs/bridge-unified'
import Logger from 'utils/Logger'
import { createInAppRequest, Request } from 'store/rpc/utils/createInAppRequest'
import { getBitcoinProvider } from 'services/network/utils/providerUtils'
import { getBitcoinCaip2ChainId, getEvmCaip2ChainId } from 'utils/caip2ChainIds'
import { TransactionParams } from '@avalabs/evm-module'
import { RpcMethod } from '@avalabs/vm-module-types'
import { Network } from '@avalabs/core-chains-sdk'
import { transactionSnackbar } from 'new/common/utils/toast'
import { selectNetworks } from 'store/network/slice'
import { RequestContext } from 'store/rpc/types'
import {
  removePendingTransfer,
  selectPendingTransfers,
  setPendingTransfer
} from './slice'

// Always initialise UnifiedBridge with the full historical type list so that
// `analyzeTx` enrichment works for any past bridge transaction in activity
// history, regardless of which bridge types are currently active for new
// transfers. Mirrors core-extension PR #902.
const ENABLED_BRIDGE_TYPES: BridgeType[] = [
  BridgeType.CCTP,
  BridgeType.ICTT_ERC20_ERC20,
  BridgeType.AVALANCHE_EVM,
  BridgeType.LOMBARD_BTC_TO_BTCB,
  BridgeType.LOMBARD_BTCB_TO_BTC
]

const showSuccessToast = (
  sourceTxHash: string,
  network: Network | undefined
): void => {
  const explorerLink = !network
    ? undefined
    : `${network.explorerUrl}/tx/${sourceTxHash}`

  transactionSnackbar.success({
    message: 'Bridge successful',
    explorerLink
  })
}

const trackPendingTransfers = (listenerApi: AppListenerEffectAPI): void => {
  const state = listenerApi.getState()
  const pendingTransfers = selectPendingTransfers(state)

  Object.values(pendingTransfers).forEach(transfer => {
    try {
      if (transfer.completedAt) {
        listenerApi.dispatch(removePendingTransfer(transfer.sourceTxHash))
        const networks = selectNetworks(state)
        const network = Object.values(networks).find(
          item => item.chainId === Number(transfer.sourceChain.chainId)
        )
        showSuccessToast(transfer.sourceTxHash, network)
      } else {
        const updateListener = (updatedTransfer: BridgeTransfer): void => {
          listenerApi.dispatch(setPendingTransfer(updatedTransfer))
        }
        UnifiedBridgeService.trackTransfer(transfer, updateListener)
      }
    } catch {
      // Unified Bridge SDK may raise an error if we're asking about a transfer
      // while we're on the wrong environment (it won't find it).
      // We do nothing when it happens. Just let it be - we'll track this transfer
      // when user switches back to mainnet/testnet.
    }
  })
}

export const createEvmSigner = (request: Request): EvmSigner => {
  return {
    sign: async (
      { data, from, to, value, chainId },
      _,
      { currentSignature, requiredSignatures }
    ) => {
      if (typeof to !== 'string') throw new Error('invalid to field')
      const txParams: [TransactionParams] = [
        {
          from,
          to,
          data: data ?? undefined,
          value: typeof value === 'bigint' ? bigIntToHex(value) : undefined
        }
      ]

      return request({
        method: RpcMethod.ETH_SEND_TRANSACTION,
        params: txParams,
        chainId: getEvmCaip2ChainId(Number(chainId)),
        context: {
          // we only want to show confetti for the final approval
          [RequestContext.CONFETTI_DISABLED]:
            requiredSignatures > currentSignature
        }
      }) as Promise<Hex>
    }
  }
}

export const initUnifiedBridgeService = async (
  action: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()
  const walletState = selectWalletState(state)

  // No need to proceed if the wallet is not unlocked
  if (walletState !== WalletState.ACTIVE) return

  const request = createInAppRequest(listenerApi.dispatch)

  if (UnifiedBridgeService.isInitialized()) {
    const prevState = listenerApi.getOriginalState()

    if (!shouldReinitializeBridge(prevState, state)) return
  }

  const isTest = selectIsDeveloperMode(state)

  const bitcoinProvider = await getBitcoinProvider(isTest)

  const evmSigner = createEvmSigner(request)

  const btcSigner: BtcSigner = {
    sign: async (txData, _, { requiredSignatures, currentSignature }) => {
      return request({
        method: RpcMethod.BITCOIN_SIGN_TRANSACTION,
        params: txData,
        chainId: getBitcoinCaip2ChainId(!isTest),
        context: {
          // we only want to show confetti for the final approval
          [RequestContext.CONFETTI_DISABLED]:
            requiredSignatures > currentSignature
        }
      })
    }
  }
  const environment = isTest ? Environment.TEST : Environment.PROD

  await UnifiedBridgeService.init({
    enabledBridgeTypes: ENABLED_BRIDGE_TYPES,
    evmSigner,
    btcSigner,
    bitcoinProvider,
    environment
  })

  trackPendingTransfers(listenerApi)
}

export const checkTransferStatus = async (
  action: ReturnType<typeof setPendingTransfer>,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  // delay 2 second to remove the completed transfer,
  // to ensure that the component(i.e. BridgeStatusScreen) displaying the transfer
  // has enough time to handle the completed status
  await listenerApi.delay(2000)

  const transfer = action.payload

  if (transfer.completedAt) {
    listenerApi.dispatch(removePendingTransfer(transfer.sourceTxHash))
    const networks = selectNetworks(listenerApi.getState())
    const network = Object.values(networks).find(
      item => item.chainId === Number(transfer.sourceChain.chainId)
    )
    showSuccessToast(transfer.sourceTxHash, network)
  }

  if (transfer.errorCode) {
    Logger.error('bridge unsuccessful', new Error(`${transfer.errorCode}`))
  }
}

export const addUnifiedBridgeListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    matcher: isAnyOf(onAppUnlocked, toggleDeveloperMode),
    effect: initUnifiedBridgeService
  })

  startListening({
    actionCreator: setPendingTransfer,
    effect: checkTransferStatus
  })
}

// Re-init only when developer mode flips (TEST <-> PROD environment).
export const shouldReinitializeBridge = (
  prevState: RootState,
  currState: RootState
): boolean =>
  selectIsDeveloperMode(prevState) !== selectIsDeveloperMode(currState)
