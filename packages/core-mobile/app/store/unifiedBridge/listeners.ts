import { bigIntToHex } from '@ethereumjs/util'
import { AppListenerEffectAPI, RootState } from 'store'
import { WalletState } from 'store/app/types'
import { onAppUnlocked, selectWalletState } from 'store/app/slice'
import { AppStartListening } from 'store/middleware/listener'
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
import { selectIsFeatureBlocked, setFeatureFlags } from 'store/posthog/slice'
import Logger from 'utils/Logger'
import { createInAppRequest, Request } from 'store/rpc/utils/createInAppRequest'
import { FeatureGates } from 'services/posthog/types'
import { getBitcoinProvider } from 'services/network/utils/providerUtils'
import { getBitcoinCaip2ChainId, getEvmCaip2ChainId } from 'utils/caip2ChainIds'
import { TransactionParams } from '@avalabs/evm-module'
import { RpcMethod } from '@avalabs/vm-module-types'
import { Network } from '@avalabs/core-chains-sdk'
import { transactionSnackbar } from 'new/common/utils/toast'
import { selectNetworks } from 'store/network/slice'
import {
  removePendingTransfer,
  selectPendingTransfers,
  setPendingTransfer
} from './slice'

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
    sign: async ({ data, from, to, value, chainId }) => {
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
        chainId: getEvmCaip2ChainId(Number(chainId))
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

  const featureGates = getFeatureGateStates(state)
  const enabledBridgeTypes = getEnabledBridgeTypes(featureGates)
  const isTest = featureGates.isDeveloperMode

  const bitcoinProvider = await getBitcoinProvider(isTest)

  const evmSigner = createEvmSigner(request)

  const btcSigner: BtcSigner = {
    sign: async txData => {
      return request({
        method: RpcMethod.BITCOIN_SIGN_TRANSACTION,
        params: txData,
        chainId: getBitcoinCaip2ChainId(!isTest)
      })
    }
  }
  const environment = isTest ? Environment.TEST : Environment.PROD

  await UnifiedBridgeService.init({
    enabledBridgeTypes,
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
    matcher: isAnyOf(onAppUnlocked, toggleDeveloperMode, setFeatureFlags),
    effect: initUnifiedBridgeService
  })

  startListening({
    actionCreator: setPendingTransfer,
    effect: checkTransferStatus
  })
}

// Helper function to get the blocked status of feature gates
const getFeatureGateStates = (
  state: RootState
): {
  isCctpBlocked: boolean
  isIcttBlocked: boolean
  isAbEvmBlocked: boolean
  isAbAvaToBtc: boolean
  isAbBtcToAva: boolean
  isDeveloperMode: boolean
} => ({
  isCctpBlocked: selectIsFeatureBlocked(
    state,
    FeatureGates.UNIFIED_BRIDGE_CCTP
  ),
  isIcttBlocked: selectIsFeatureBlocked(
    state,
    FeatureGates.UNIFIED_BRIDGE_ICTT
  ),
  isAbEvmBlocked: selectIsFeatureBlocked(
    state,
    FeatureGates.UNIFIED_BRIDGE_AB_EVM
  ),
  isAbAvaToBtc: selectIsFeatureBlocked(
    state,
    FeatureGates.UNIFIED_BRIDGE_AB_AVA_TO_BTC
  ),
  isAbBtcToAva: selectIsFeatureBlocked(
    state,
    FeatureGates.UNIFIED_BRIDGE_AB_BTC_TO_AVA
  ),
  isDeveloperMode: selectIsDeveloperMode(state)
})

// Check if any of the feature gate states or developer mode has changed
export const shouldReinitializeBridge = (
  prevState: RootState,
  currState: RootState
): boolean => {
  const prevGates = getFeatureGateStates(prevState)
  const currGates = getFeatureGateStates(currState)

  return (
    prevGates.isCctpBlocked !== currGates.isCctpBlocked ||
    prevGates.isIcttBlocked !== currGates.isIcttBlocked ||
    prevGates.isAbEvmBlocked !== currGates.isAbEvmBlocked ||
    prevGates.isAbAvaToBtc !== currGates.isAbAvaToBtc ||
    prevGates.isAbBtcToAva !== currGates.isAbBtcToAva ||
    prevGates.isDeveloperMode !== currGates.isDeveloperMode
  )
}

// Get enabled bridge types based on feature gates
const getEnabledBridgeTypes = (featureGates: {
  isCctpBlocked: boolean
  isIcttBlocked: boolean
  isAbEvmBlocked: boolean
  isAbAvaToBtc: boolean
  isAbBtcToAva: boolean
  isDeveloperMode: boolean
}): BridgeType[] => {
  const enabledBridgeTypes: BridgeType[] = []

  if (!featureGates.isCctpBlocked) {
    enabledBridgeTypes.push(BridgeType.CCTP)
  }
  if (!featureGates.isIcttBlocked) {
    enabledBridgeTypes.push(BridgeType.ICTT_ERC20_ERC20)
  }
  if (!featureGates.isAbEvmBlocked) {
    enabledBridgeTypes.push(BridgeType.AVALANCHE_EVM)
  }
  if (!featureGates.isAbAvaToBtc) {
    enabledBridgeTypes.push(BridgeType.AVALANCHE_AVA_BTC)
  }
  if (!featureGates.isAbBtcToAva) {
    enabledBridgeTypes.push(BridgeType.AVALANCHE_BTC_AVA)
  }

  return enabledBridgeTypes
}
