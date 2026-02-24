import { AppListenerEffectAPI, AppStartListening, RootState } from 'store/types'
import { onAppUnlocked, onLogOut, selectIsLocked } from 'store/app/slice'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced/slice'
import { isAnyOf } from '@reduxjs/toolkit'
import {
  selectIsFusionEnabled,
  selectIsFusionMarkrEnabled,
  selectIsFusionAvalancheEvmEnabled,
  selectIsFusionLombardBtcToBtcbEnabled,
  selectIsFusionLombardBtcbToBtcEnabled,
  setFeatureFlags
} from 'store/posthog/slice'
import Logger from 'utils/Logger'
import { createInAppRequest } from 'store/rpc/utils/createInAppRequest'
import { getBitcoinProvider } from 'services/network/utils/providerUtils'
import FusionService from '../services/FusionService'
import { getFusionEnvironment } from '../consts'
import { createEvmSigner } from '../services/signers/EvmSigner'
import { createBtcSigner } from '../services/signers/BtcSigner'
import {
  useIsFusionServiceReady,
  updateFusionTransfer,
  getPendingFusionTransfers
} from '../hooks/useZustandStore'
import { fetchAdapter } from '../utils/fetchAdapter'
import { trackFusionTransfer } from './actions'

/**
 * Get the current state of all Fusion feature flags
 */
const getFusionFeatureStates = (
  state: RootState
): {
  isFusionEnabled: boolean
  isFusionMarkrEnabled: boolean
  isFusionAvalancheEvmEnabled: boolean
  isFusionLombardBtcToBtcbEnabled: boolean
  isFusionLombardBtcbToBtcEnabled: boolean
  isDeveloperMode: boolean
} => ({
  isFusionEnabled: selectIsFusionEnabled(state),
  isFusionMarkrEnabled: selectIsFusionMarkrEnabled(state),
  isFusionAvalancheEvmEnabled: selectIsFusionAvalancheEvmEnabled(state),
  isFusionLombardBtcToBtcbEnabled: selectIsFusionLombardBtcToBtcbEnabled(state),
  isFusionLombardBtcbToBtcEnabled: selectIsFusionLombardBtcbToBtcEnabled(state),
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
    prevFeatures.isFusionLombardBtcToBtcbEnabled !==
      currentFeatures.isFusionLombardBtcToBtcbEnabled ||
    prevFeatures.isFusionLombardBtcbToBtcEnabled !==
      currentFeatures.isFusionLombardBtcbToBtcEnabled ||
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
      FusionService.trackTransfer(transfer, updateFusionTransfer)
    }
  } catch (error) {
    Logger.error('[FusionTracking] failed to resume transfer tracking', error)
  }
}

/**
 * Initialize the Fusion service with current settings
 */
export const initFusionService = async (
  _action: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()
  const isLocked = selectIsLocked(state)

  if (isLocked) {
    Logger.info('App is locked, skipping Fusion service initialization')
    return
  }

  const request = createInAppRequest(listenerApi.dispatch)

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
    return
  }

  try {
    Logger.info('Initializing Fusion service', featureStates)

    // Mark as not ready at start
    useIsFusionServiceReady.setState(false)

    // Create signers
    const evmSigner = createEvmSigner(request)
    const btcSigner = createBtcSigner(request, featureStates.isDeveloperMode)

    // Determine environment
    const environment = getFusionEnvironment(featureStates.isDeveloperMode)

    // Build feature flags object for the service
    const featureFlags = {
      'fusion-markr': featureStates.isFusionMarkrEnabled,
      'fusion-avalanche-evm': featureStates.isFusionAvalancheEvmEnabled,
      'fusion-lombard-btc-to-btcb':
        featureStates.isFusionLombardBtcToBtcbEnabled,
      'fusion-lombard-btcb-to-btc':
        featureStates.isFusionLombardBtcbToBtcEnabled
    }

    const bitcoinProvider = await getBitcoinProvider(
      featureStates.isDeveloperMode
    )

    // Initialize the service
    await FusionService.initWithFeatureFlags({
      bitcoinProvider,
      fetch: fetchAdapter,
      environment,
      featureFlags,
      signers: {
        evm: evmSigner,
        btc: btcSigner
      }
    })

    // Mark as ready after successful init
    useIsFusionServiceReady.setState(true)

    Logger.info('Fusion service initialized successfully', {
      environment,
      enabledServices: Object.entries(featureFlags)
        .filter(([, enabled]) => enabled)
        .map(([key]) => key)
    })

    resumeTransfersTracking()
  } catch (error) {
    Logger.error('Failed to initialize Fusion service', error)
    // Mark as not ready on error
    useIsFusionServiceReady.setState(false)
  }
}

export const cleanupFusionService = async (
  _action: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  _listenerApi: AppListenerEffectAPI
): Promise<void> => {
  FusionService.cleanup()
  useIsFusionServiceReady.setState(false)
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
    effect: async ({ payload: transfer }) => {
      // 2s delay: avoids Markr API race condition before it indexes the tx
      await new Promise(resolve => setTimeout(resolve, 2000))
      FusionService.trackTransfer(transfer, updateFusionTransfer)
    }
  })
}
