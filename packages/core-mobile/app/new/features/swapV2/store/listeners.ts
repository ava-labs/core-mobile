import { fetch as expoFetch } from 'expo/fetch'
import { AppListenerEffectAPI, AppStartListening, RootState } from 'store/types'
import { onAppUnlocked, onLogOut, selectIsLocked } from 'store/app/slice'

/**
 * Fetch adapter that uses expo-fetch for all requests
 *
 * Strategy:
 * - Checks content-type to detect streaming responses
 * - For streaming responses (text/event-stream, application/stream):
 *   Returns expo-fetch response as-is
 *   Preserves the body stream for SSE
 *   The SDK reads .body directly (doesn't use .clone())
 * - For non-streaming responses (JSON, text):
 *   Reads body and creates standard Response
 *   Makes .clone() work for the SDK's _safeParseResponse
 */
const fetchAdapter: typeof globalThis.fetch = async (input, init) => {
  // Convert RequestInfo | URL to string for expo-fetch
  let url: string
  if (input instanceof Request) {
    url = input.url
  } else if (input instanceof URL) {
    url = input.href
  } else if (typeof input === 'string') {
    // After checking Request and URL, input must be string
    url = input
  } else {
    throw new Error('Invalid input type')
  }

  // Use expo-fetch for the request
  // Convert RequestInit to FetchRequestInit (expo-fetch doesn't allow null values)
  const fetchInit = init
    ? {
        ...init,
        body: init.body === null ? undefined : init.body,
        signal: init.signal === null ? undefined : init.signal,
        window: init.window === null ? undefined : init.window
      }
    : undefined
  const response = await expoFetch(url, fetchInit)

  // Check content-type to determine if this is a streaming response
  const contentType = response.headers.get('content-type') || ''
  const isStreaming =
    contentType.includes('text/event-stream') ||
    contentType.includes('application/stream')

  if (isStreaming) {
    // For streaming: return expo-fetch response as-is (SDK reads .body directly)
    Logger.info('Streaming response, returning as-is:', {
      url,
      contentType,
      status: response.status
    })
    return response
  } else {
    // For non-streaming: read body and create standard Response to support .clone()
    Logger.info('Non-streaming response, creating cloneable Response:', {
      url,
      contentType,
      status: response.status
    })

    const body = await response.text()
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    })
  }
}
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
import { useIsFusionServiceReady } from '../hooks/useZustandStore'

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
}
