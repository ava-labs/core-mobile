import { AppListenerEffectAPI, AppStartListening, RootState } from 'store/types'
import { onAppUnlocked, onLogOut, selectIsLocked } from 'store/app/slice'
import {
  selectIsDeveloperMode,
  selectQuickSwapsMaxBuy,
  toggleDeveloperMode
} from 'store/settings/advanced/slice'
import {
  selectIsQuickSwapsActive,
  selectIsBatchSigningSupported
} from 'store/settings/advanced/quickSwapsActive'
import { isAnyOf } from '@reduxjs/toolkit'
import {
  selectIsFusionEnabled,
  selectIsFusionMarkrEnabled,
  selectIsFusionAvalancheEvmEnabled,
  selectIsFusionAvalancheCctEnabled,
  selectIsFusionLombardBtcToBtcbEnabled,
  selectIsFusionLombardBtcbToBtcEnabled,
  selectFusionDisableCrossChainSwaps,
  setFeatureFlags
} from 'store/posthog/slice'
import Logger from 'utils/Logger'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { createInAppRequest } from 'store/rpc/utils/createInAppRequest'
import {
  getBitcoinProvider,
  getEvmProvider
} from 'services/network/utils/providerUtils'
import { selectNetwork } from 'store/network/slice'
import type {
  CompletedTransfer,
  FailedTransfer,
  RefundedTransfer
} from '@avalabs/fusion-sdk'
import {
  isCompletedTransfer,
  isFailedTransfer,
  isRefundedTransfer
} from '../utils/transferStatus'
import FusionService from '../services/FusionService'
import { getFusionEnvironment } from '../consts'
import { createEvmSigner } from '../services/signers/EvmSigner'
import { createBtcSigner } from '../services/signers/BtcSigner'
import { createSvmSigner } from '../services/signers/SvmSigner'
import { buildCctDependencies } from '../services/cct/buildCctDependencies'
import {
  useIsFusionServiceReady,
  useFusionServiceInitError,
  updateFusionTransfer,
  getPendingFusionTransfers
} from '../hooks/useZustandStore'
import { fetchAdapter } from '../utils/fetchAdapter'
import { logSdkError } from '../utils/fusionLogger'
import { trackFusionTransfer, type TrackFusionTransferPayload } from './actions'

/**
 * Get the current state of all Fusion feature flags
 */
const getFusionFeatureStates = (
  state: RootState
): {
  isFusionEnabled: boolean
  isFusionMarkrEnabled: boolean
  isFusionAvalancheEvmEnabled: boolean
  isFusionAvalancheCctEnabled: boolean
  isFusionLombardBtcToBtcbEnabled: boolean
  isFusionLombardBtcbToBtcEnabled: boolean
  isFusionDisableCrossChainSwaps: boolean
  isDeveloperMode: boolean
} => ({
  isFusionEnabled: selectIsFusionEnabled(state),
  isFusionMarkrEnabled: selectIsFusionMarkrEnabled(state),
  isFusionAvalancheEvmEnabled: selectIsFusionAvalancheEvmEnabled(state),
  isFusionAvalancheCctEnabled: selectIsFusionAvalancheCctEnabled(state),
  isFusionLombardBtcToBtcbEnabled: selectIsFusionLombardBtcToBtcbEnabled(state),
  isFusionLombardBtcbToBtcEnabled: selectIsFusionLombardBtcbToBtcEnabled(state),
  isFusionDisableCrossChainSwaps: selectFusionDisableCrossChainSwaps(state),
  isDeveloperMode: selectIsDeveloperMode(state)
})

/**
 * Determine if the Fusion service should be reinitialized
 * based on state changes
 */
const shouldReinitializeFusion = (
  prevState: RootState,
  currentState: RootState
): boolean => {
  const prevFeatures = getFusionFeatureStates(prevState)
  const currentFeatures = getFusionFeatureStates(currentState)

  // Reinitialize if any relevant feature flag or setting changed
  return (
    prevFeatures.isFusionEnabled !== currentFeatures.isFusionEnabled ||
    prevFeatures.isFusionMarkrEnabled !==
      currentFeatures.isFusionMarkrEnabled ||
    prevFeatures.isFusionAvalancheEvmEnabled !==
      currentFeatures.isFusionAvalancheEvmEnabled ||
    prevFeatures.isFusionAvalancheCctEnabled !==
      currentFeatures.isFusionAvalancheCctEnabled ||
    prevFeatures.isFusionLombardBtcToBtcbEnabled !==
      currentFeatures.isFusionLombardBtcToBtcbEnabled ||
    prevFeatures.isFusionLombardBtcbToBtcEnabled !==
      currentFeatures.isFusionLombardBtcbToBtcEnabled ||
    prevFeatures.isFusionDisableCrossChainSwaps !==
      currentFeatures.isFusionDisableCrossChainSwaps ||
    prevFeatures.isDeveloperMode !== currentFeatures.isDeveloperMode
  )
}

/**
 * Resume tracking for any transfers that were in-progress.
 * Called after every Fusion reinit since the transferManager is recreated.
 */
const resumeTransfersTracking = (): void => {
  try {
    const pending = getPendingFusionTransfers()
    for (const { transfer } of pending) {
      Logger.info('[FusionTracking] resuming tracking for', transfer.id)
      // Original UI state (quote, userClickedMax) is lost across reinit;
      // resumed analytics emit without the CP-14225 enrichment fields.
      FusionService.trackTransfer(
        transfer,
        updateFusionTransfer,
        createCaptureSwapAnalytics()
      )
    }
  } catch (error) {
    Logger.error('[FusionTracking] failed to resume transfer tracking', error)
  }
}

let isFusionInitializing = false

/**
 * Initialize the Fusion service with current settings
 */
export const initFusionService = async (
  _action: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  if (isFusionInitializing) return
  isFusionInitializing = true

  try {
    const state = listenerApi.getState()
    const isLocked = selectIsLocked(state)

    if (isLocked) {
      Logger.info('App is locked, skipping Fusion service initialization')
      return
    }

    const request = createInAppRequest(
      listenerApi.dispatch,
      listenerApi.getState
    )

    // Check if already initialized and if reinitialization is needed
    const isFusionServiceReady = useIsFusionServiceReady.getState()
    if (isFusionServiceReady) {
      const prevState = listenerApi.getOriginalState()

      if (!shouldReinitializeFusion(prevState, state)) return

      // Mark as not ready during reinitialization
      useIsFusionServiceReady.setState(false)
      FusionService.cleanup()
    }

    const featureStates = getFusionFeatureStates(state)

    // Don't initialize if Fusion is not enabled
    if (!featureStates.isFusionEnabled) {
      Logger.info('Fusion is disabled, skipping initialization')
      useIsFusionServiceReady.setState(false)
      useFusionServiceInitError.setState(null)
      return
    }

    Logger.info('Initializing Fusion service', featureStates)

    useIsFusionServiceReady.setState(false)
    useFusionServiceInitError.setState(null)

    // Getter (not captured value) so the signer reads live Quick Swaps
    // settings — the user can toggle between init and swap execution.
    // Uses the composite selector so PostHog flag, wallet allowlist,
    // and the saved toggle all gate the bypass consistently — a stale
    // `isEnabled: true` on a hardware wallet or with the flag off must
    // NOT trigger bypass.
    const evmSigner = createEvmSigner(
      request,
      () => {
        const liveState = listenerApi.getState()
        return {
          isQuickSwapsActive: selectIsQuickSwapsActive(liveState),
          maxBuy: selectQuickSwapsMaxBuy(liveState),
          // Recurring batches gate on this to decide whether `signBatch`
          // can return a signed array (software wallets) or must throw
          // `BatchSigningUnsupportedError` so the SDK falls back to the
          // per-tx path (hardware / WalletConnect).
          isBatchSigningSupported: selectIsBatchSigningSupported(liveState)
        }
      },
      async (chainId, txHash) => {
        const network = selectNetwork(Number(chainId))(listenerApi.getState())
        if (!network) return
        const provider = await getEvmProvider(network)
        await provider.waitForTransaction(txHash, 1, 60_000)
      }
    )
    const btcSigner = createBtcSigner(request, featureStates.isDeveloperMode)
    const svmSigner = createSvmSigner(request, featureStates.isDeveloperMode)

    const environment = getFusionEnvironment(featureStates.isDeveloperMode)

    const featureFlags = {
      'fusion-markr': featureStates.isFusionMarkrEnabled,
      'fusion-avalanche-evm': featureStates.isFusionAvalancheEvmEnabled,
      'fusion-avalanche-cct': featureStates.isFusionAvalancheCctEnabled,
      'fusion-lombard-btc-to-btcb':
        featureStates.isFusionLombardBtcToBtcbEnabled,
      'fusion-lombard-btcb-to-btc':
        featureStates.isFusionLombardBtcbToBtcEnabled,
      'fusion-disable-cross-chain-swaps':
        featureStates.isFusionDisableCrossChainSwaps
    }

    const bitcoinProvider = await getBitcoinProvider(
      featureStates.isDeveloperMode
    )

    // CCT callbacks read live Redux + React Query state on each invocation so
    // they always see the latest account / wallet / xpAddresses. The
    // TransferManager doesn't need to be recreated when those change.
    const cctDependencies = featureStates.isFusionAvalancheCctEnabled
      ? buildCctDependencies(listenerApi)
      : undefined

    // Initialize the service
    await FusionService.initWithFeatureFlags({
      bitcoinProvider,
      fetch: fetchAdapter,
      environment,
      featureFlags,
      signers: {
        evm: evmSigner,
        btc: btcSigner,
        svm: svmSigner
      },
      cctDependencies
    })

    // Mark as ready after successful init
    useIsFusionServiceReady.setState(true)

    resumeTransfersTracking()
  } catch (error) {
    logSdkError(
      '[initFusionService listener] Failed to initialize Fusion service',
      error
    )
    useIsFusionServiceReady.setState(false)
    useFusionServiceInitError.setState(
      error instanceof Error ? error : new Error(String(error))
    )
  } finally {
    isFusionInitializing = false
  }
}

export const cleanupFusionService = async (
  _action: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  _listenerApi: AppListenerEffectAPI
): Promise<void> => {
  FusionService.cleanup()
  useIsFusionServiceReady.setState(false)
  useFusionServiceInitError.setState(null)
}

/**
 * Build a `concludedTransfer` callback for `FusionService.trackTransfer` that
 * forwards Fusion outcomes to PostHog. The `context` carries client-side data
 * the SDK's Transfer object does not (was-it-Max-button, token metadata,
 * aggregator name/id) and is captured on `SwapFailed` so we can diagnose
 * Markr toxic-pool cohorts post-hoc.
 *
 * Context is fully optional because `resumeTransfersTracking` re-creates the
 * callback after an app reinit, when the original UI state (quote object,
 * userClickedMax flag) is no longer in memory.
 */
export const createCaptureSwapAnalytics = (
  context: Partial<Omit<TrackFusionTransferPayload, 'transfer'>> = {}
) => {
  return (
    concludedTransfer: CompletedTransfer | FailedTransfer | RefundedTransfer
  ): void => {
    const addresses = {
      sourceAddress: concludedTransfer.fromAddress,
      targetAddress: concludedTransfer.toAddress,
      sourceChainId: concludedTransfer.sourceChain.chainId,
      targetChainId: concludedTransfer.targetChain.chainId
    }

    if (isCompletedTransfer(concludedTransfer)) {
      AnalyticsService.capture('SwapSuccessful', {
        encrypted: {
          ...addresses,
          sourceTxHash: concludedTransfer.source.txHash,
          targetTxHash: concludedTransfer.target?.txHash
        }
      })
    } else if (isFailedTransfer(concludedTransfer)) {
      // source is optional on FailedTransfer — tx may not have been submitted
      AnalyticsService.capture('SwapFailed', {
        encrypted: {
          ...addresses,
          sourceTxHash: concludedTransfer.source?.txHash,
          targetTxHash: concludedTransfer.target?.txHash,
          errorCode: concludedTransfer.errorCode?.toString(),
          errorReason: concludedTransfer.errorReason ?? undefined,
          userClickedMax: context.userClickedMax,
          sourceTokenAddress: context.sourceTokenAddress,
          sourceTokenSymbol: context.sourceTokenSymbol,
          sourceAmount: context.quote?.amountIn.toString(),
          destinationTokenAddress: context.destinationTokenAddress,
          destinationTokenSymbol: context.destinationTokenSymbol,
          quoteAggregator: context.quote?.aggregator.name,
          quoteAggregatorId: context.quote?.aggregator.id
        }
      })
    } else if (isRefundedTransfer(concludedTransfer)) {
      AnalyticsService.capture('SwapRefunded', {
        encrypted: {
          ...addresses,
          sourceTxHash: concludedTransfer.source.txHash,
          targetTxHash: concludedTransfer.target?.txHash,
          refundTxHash: concludedTransfer.refund.txHash ?? undefined
        }
      })
    }
  }
}

/**
 * Register Fusion service listeners
 */
export const addFusionListeners = (startListening: AppStartListening): void => {
  startListening({
    matcher: isAnyOf(onAppUnlocked, toggleDeveloperMode, setFeatureFlags),
    effect: initFusionService
  })

  startListening({
    actionCreator: onLogOut,
    effect: cleanupFusionService
  })

  startListening({
    actionCreator: trackFusionTransfer,
    effect: async ({ payload }, listenerApi: AppListenerEffectAPI) => {
      if (!selectIsFusionEnabled(listenerApi.getState())) return

      try {
        // 2s delay: avoids Markr API race condition before it indexes the tx
        await listenerApi.delay(2000)
      } catch {
        // Listener aborted (e.g. on logout); do not continue
        return
      }

      try {
        const { transfer, ...context } = payload
        FusionService.trackTransfer(
          transfer,
          updateFusionTransfer,
          createCaptureSwapAnalytics(context)
        )
      } catch (error) {
        logSdkError('[trackFusionTransfer listener] error', error)
      }
    }
  })
}
