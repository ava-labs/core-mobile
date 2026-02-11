import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import type { TransferManager } from '@avalabs/unified-asset-transfer'
import {
  selectIsFusionEnabled,
  selectIsFusionMarkrEnabled,
  selectIsFusionAvalancheEvmEnabled,
  selectIsFusionLombardBtcToBtcbEnabled,
  selectIsFusionLombardBtcbToBtcEnabled
} from 'store/posthog/slice'
import { selectIsDeveloperMode } from 'store/settings/advanced/slice'
import { createInAppRequest } from 'store/rpc/utils/createInAppRequest'
import { useDispatch } from 'react-redux'
import Logger from 'utils/Logger'
import { getBitcoinProvider } from 'services/network/utils/providerUtils'
import FusionService from '../services/FusionService'
import { getFusionEnvironment } from '../consts'
import { createEvmSigner } from '../services/signers/EvmSigner'
import { createBtcSigner } from '../services/signers/BtcSigner'

/**
 * React hook to manage and provide the Fusion SDK TransferManager instance
 *
 * This hook:
 * - Initializes the FusionService when the Fusion feature is enabled
 * - Creates signers for EVM and BTC transactions
 * - Determines the environment (DEV/TEST/PROD) based on app settings
 * - Configures enabled services based on feature flags
 * - Returns the TransferManager instance for use in swap operations
 *
 * @returns TransferManager instance or null if not initialized
 */
export function useTransferManager(): TransferManager | null {
  const dispatch = useDispatch()
  const [transferManager, setTransferManager] =
    useState<TransferManager | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)

  // Feature flags
  const isFusionEnabled = useSelector(selectIsFusionEnabled)
  const isFusionMarkrEnabled = useSelector(selectIsFusionMarkrEnabled)
  const isFusionAvalancheEvmEnabled = useSelector(
    selectIsFusionAvalancheEvmEnabled
  )
  const isFusionLombardBtcToBtcbEnabled = useSelector(
    selectIsFusionLombardBtcToBtcbEnabled
  )
  const isFusionLombardBtcbToBtcEnabled = useSelector(
    selectIsFusionLombardBtcbToBtcEnabled
  )

  // App settings
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  useEffect(() => {
    // Early return if Fusion is not enabled
    if (!isFusionEnabled) {
      if (FusionService.isInitialized()) {
        FusionService.cleanup()
        setTransferManager(null)
      }
      return
    }

    // Prevent multiple initializations
    if (isInitializing) {
      return
    }

    // Initialize the Fusion service
    const initializeFusion = async (): Promise<void> => {
      try {
        setIsInitializing(true)

        // Create request handler for signers
        const request = createInAppRequest(dispatch)

        // Create signers
        const evmSigner = createEvmSigner(request)
        const btcSigner = createBtcSigner(request, isDeveloperMode)

        // Determine environment
        const environment = getFusionEnvironment(isDeveloperMode)

        // Build feature flags object for service
        const featureFlags = {
          'fusion-markr': isFusionMarkrEnabled,
          'fusion-avalanche-evm': isFusionAvalancheEvmEnabled,
          'fusion-lombard-btc-to-btcb': isFusionLombardBtcToBtcbEnabled,
          'fusion-lombard-btcb-to-btc': isFusionLombardBtcbToBtcEnabled
        }

        // Get Bitcoin provider
        const bitcoinProvider = await getBitcoinProvider(isDeveloperMode)

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

        // Get the initialized TransferManager
        const manager = FusionService.getTransferManager()
        setTransferManager(manager)

        Logger.info('TransferManager initialized successfully')
      } catch (error) {
        Logger.error('Failed to initialize TransferManager', error)
        setTransferManager(null)
      } finally {
        setIsInitializing(false)
      }
    }

    // Only initialize if not already initialized or if settings changed
    if (!FusionService.isInitialized()) {
      initializeFusion()
    } else {
      // Service is already initialized, just get the instance
      setTransferManager(FusionService.getTransferManager())
    }

    // Cleanup function
    return () => {
      // Note: We don't cleanup on unmount because the service is a singleton
      // and may be used by other components. Only cleanup when fusion is disabled.
    }
  }, [
    isFusionEnabled,
    isFusionMarkrEnabled,
    isFusionAvalancheEvmEnabled,
    isFusionLombardBtcToBtcbEnabled,
    isFusionLombardBtcbToBtcEnabled,
    isDeveloperMode,
    dispatch,
    isInitializing
  ])

  return transferManager
}
