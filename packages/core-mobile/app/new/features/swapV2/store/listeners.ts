import { AppListenerEffectAPI, AppStartListening, RootState } from 'store/types'
import { onAppUnlocked } from 'store/app/slice'
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
 * Initialize the Fusion service with current settings
 */
export const initFusionService = async (
  _action: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()

  const request = createInAppRequest(listenerApi.dispatch)

  // Check if already initialized and if reinitialization is needed
  if (FusionService.isInitialized()) {
    const prevState = listenerApi.getOriginalState()

    if (!shouldReinitializeFusion(prevState, state)) return

    // Cleanup before reinitializing
    FusionService.cleanup()
  }

  const featureStates = getFusionFeatureStates(state)

  // Don't initialize if Fusion is not enabled
  if (!featureStates.isFusionEnabled) {
    Logger.info('Fusion is disabled, skipping initialization')
    return
  }

  try {
    Logger.info('Initializing Fusion service', featureStates)

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
      environment,
      featureFlags,
      signers: {
        evm: evmSigner,
        btc: btcSigner
      }
    })

    Logger.info('Fusion service initialized successfully', {
      environment,
      enabledServices: Object.entries(featureFlags)
        .filter(([, enabled]) => enabled)
        .map(([key]) => key)
    })
  } catch (error) {
    Logger.error('Failed to initialize Fusion service', error)
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
}
