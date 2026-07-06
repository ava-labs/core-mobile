import { ActivityIndicator, Button, ButtonType } from '@avalabs/k2-alpine'
import { ProgressDots } from 'common/components/ProgressDots'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useEffectiveHeaderHeight } from 'common/hooks/useEffectiveHeaderHeight'
import { showSnackbar } from 'common/utils/toast'
import {
  AppConnectionStep,
  LedgerAppConnection
} from 'new/features/ledger/components/LedgerAppConnection'
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { Alert, Platform, View } from 'react-native'
import { useSelector } from 'react-redux'
import {
  isLedgerBluetoothError,
  showBluetoothErrorAlert
} from 'services/ledger/LedgerBluetoothError'
import LedgerService from 'services/ledger/LedgerService'
import {
  LedgerDerivationPathType,
  LedgerKeysByNetwork,
  LedgerMultiIndexKeys,
  MAX_LEDGER_DISCOVERY_ACCOUNTS,
  PublicKeyInfo
} from 'services/ledger/types'
import { selectIsSolanaSupportBlocked } from 'store/posthog'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import Logger from 'utils/Logger'
import {
  buildFirstAccountKeys,
  deriveRangeKeys
} from '../utils/deriveMultiIndexKeys'

export default function AppConnectionScreen({
  selectedDerivationPath = LedgerDerivationPathType.BIP44,
  completeStepTitle,
  isUpdatingWallet,
  handleComplete,
  deviceId,
  deviceName = 'Ledger',
  handleCancel,
  accountIndex,
  showProgressDots = true,
  showConnectionToasts,
  showCancelOnComplete
}: {
  selectedDerivationPath?: LedgerDerivationPathType
  completeStepTitle: string
  isUpdatingWallet: boolean
  deviceId?: string | null
  deviceName?: string
  handleCancel: () => Promise<void>
  handleComplete: (keys: LedgerMultiIndexKeys) => Promise<void>
  accountIndex: number
  showProgressDots?: boolean
  showConnectionToasts: boolean
  showCancelOnComplete: boolean
}): JSX.Element {
  const headerHeight = useEffectiveHeaderHeight()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const isSolanaSupportBlocked = useSelector(selectIsSolanaSupportBlocked)

  const hasDeviceId = !!deviceId
  const isAddingAccount = accountIndex > 0

  // Local key state - managed only in this component
  const [multiIndexKeys, setMultiIndexKeys] = useState<LedgerMultiIndexKeys>({
    mainnet: {},
    testnet: {}
  })

  const [currentAppConnectionStep, setAppConnectionStep] =
    useState<AppConnectionStep>(AppConnectionStep.AVALANCHE_CONNECT)
  const [skipSolana, setSkipSolana] = useState(false)

  // AbortController for cancelling in-flight Solana key retrieval.
  // Created fresh each time handleConnectSolana runs; aborted when the
  // user taps "Skip Solana" or the component unmounts.
  const solanaAbortControllerRef = useRef<AbortController | null>(null)

  const progressDotsCurrentStep = useMemo(() => {
    if (isSolanaSupportBlocked) {
      // If Solana support is blocked, skip Solana step in progress dots
      switch (currentAppConnectionStep) {
        case AppConnectionStep.AVALANCHE_CONNECT:
        case AppConnectionStep.AVALANCHE_LOADING:
          return 0

        case AppConnectionStep.COMPLETE:
          return 1

        default:
          return 0
      }
    }

    switch (currentAppConnectionStep) {
      case AppConnectionStep.AVALANCHE_CONNECT:
      case AppConnectionStep.AVALANCHE_LOADING:
        return 0

      case AppConnectionStep.SOLANA_CONNECT:
      case AppConnectionStep.SOLANA_LOADING:
        return 1

      case AppConnectionStep.COMPLETE:
        return 2

      default:
        return 0
    }
  }, [currentAppConnectionStep, isSolanaSupportBlocked])

  // Cleanup: Stop polling and cancel any in-flight Solana requests
  // when the component unmounts (e.g. navigating away).
  useEffect(() => {
    return () => {
      Logger.info('AppConnectionScreen unmounting, stopping app polling')
      solanaAbortControllerRef.current?.abort()
      LedgerService.stopAppPolling()
    }
  }, [])

  // The device "Open Solana?" prompt is intentionally deferred until the user
  // taps Continue: `handleConnectSolana` → getSolanaKeysForRange →
  // ensureAppReady → openApp. Prompting eagerly on step entry meant the device
  // asked even when the user went on to tap "Skip Solana".

  const headerCenterOverlay = useMemo(() => {
    if (!showProgressDots) return undefined

    const paddingTop = Platform.OS === 'ios' ? 15 : 50

    return (
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: headerHeight
        }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop
          }}>
          <ProgressDots
            totalSteps={isSolanaSupportBlocked ? 2 : 3}
            currentStep={progressDotsCurrentStep}
          />
        </View>
      </View>
    )
  }, [
    showProgressDots,
    headerHeight,
    isSolanaSupportBlocked,
    progressDotsCurrentStep
  ])

  const handleConnectAvalanche = useCallback(async () => {
    try {
      if (!deviceId) {
        throw new Error('No device ID found')
      }
      await LedgerService.connect(deviceId)
      setAppConnectionStep(AppConnectionStep.AVALANCHE_LOADING)

      const count = isAddingAccount ? 1 : MAX_LEDGER_DISCOVERY_ACCOUNTS
      const isBIP44 = selectedDerivationPath === LedgerDerivationPathType.BIP44
      const startIndex = isAddingAccount ? accountIndex : 0

      const firstAccountKeys = await LedgerService.getAvalancheKeys(
        startIndex,
        isDeveloperMode,
        selectedDerivationPath
      )

      const firstKeys = await buildFirstAccountKeys({
        firstAccountKeys,
        isBIP44,
        isDeveloperMode,
        startIndex
      })

      const rangeKeys = await deriveRangeKeys(
        count,
        isBIP44,
        firstAccountKeys.xpubs.evm
      )

      setMultiIndexKeys({
        mainnet: { ...firstKeys.mainnet, ...rangeKeys.mainnet },
        testnet: { ...firstKeys.testnet, ...rangeKeys.testnet }
      })

      if (showConnectionToasts) showSnackbar('Avalanche app connected')
      setAppConnectionStep(
        isSolanaSupportBlocked
          ? AppConnectionStep.COMPLETE
          : AppConnectionStep.SOLANA_CONNECT
      )
    } catch (err) {
      Logger.error('Failed to connect to Avalanche app', err)
      setAppConnectionStep(AppConnectionStep.AVALANCHE_CONNECT)
      if (isLedgerBluetoothError(err)) {
        showBluetoothErrorAlert(err)
        return
      }
      Alert.alert(
        'Connection Failed',
        'Failed to connect to Avalanche app. Please make sure the Avalanche app is open on your Ledger.',
        [{ text: 'OK' }]
      )
    }
  }, [
    accountIndex,
    deviceId,
    isAddingAccount,
    isDeveloperMode,
    isSolanaSupportBlocked,
    selectedDerivationPath,
    showConnectionToasts
  ])

  const handleConnectSolana = useCallback(async () => {
    try {
      if (!deviceId) {
        throw new Error('No device ID found')
      }
      await LedgerService.connect(deviceId)
      setAppConnectionStep(AppConnectionStep.SOLANA_LOADING)

      // Create a fresh AbortController for this connection attempt.
      // If the user taps "Skip Solana" or the component unmounts while
      // we're waiting, handleSkipSolana / cleanup will call abort() on
      // this controller, which cancels waitForApp polling and the
      // getSolanaKeysForRange loop.
      const controller = new AbortController()
      solanaAbortControllerRef.current = controller

      // Get keys from service
      const count = isAddingAccount ? 1 : MAX_LEDGER_DISCOVERY_ACCOUNTS
      const startIndex = isAddingAccount ? accountIndex : 0
      const solanaKeysRange = await LedgerService.getSolanaKeysForRange(
        count,
        startIndex,
        controller.signal
      )

      // If the user tapped "Skip Solana" while we were fetching keys,
      // don't merge partial results or show a success toast.
      if (controller.signal.aborted) return

      // Update local state
      setMultiIndexKeys(prev =>
        mergeSolanaKeys(prev, solanaKeysRange, { startIndex, count })
      )

      // Show success toast notification
      if (showConnectionToasts) showSnackbar('Solana app connected')

      // Skip success step and go directly to complete
      setAppConnectionStep(AppConnectionStep.COMPLETE)
    } catch (err) {
      // If the user cancelled (Skip Solana or unmount), don't show an error —
      // the cancellation was intentional.
      if (solanaAbortControllerRef.current?.signal.aborted) {
        Logger.info('Solana connection cancelled by user')
        return
      }

      Logger.error('Failed to connect to Solana app', err)
      setAppConnectionStep(AppConnectionStep.SOLANA_CONNECT)
      if (isLedgerBluetoothError(err)) {
        showBluetoothErrorAlert(err)
        return
      }
      Alert.alert(
        'Connection Failed',
        'Failed to connect to Solana app. Please make sure the Solana app is installed and open on your Ledger.',
        [{ text: 'OK' }]
      )
    }
  }, [accountIndex, deviceId, isAddingAccount, showConnectionToasts])

  const handleSkipSolana = useCallback(() => {
    // Cancel any in-flight Solana key retrieval. This aborts the
    // waitForApp polling loop and getSolanaKeysForRange iteration so the
    // Ledger device stops receiving APDU requests for the Solana app.
    solanaAbortControllerRef.current?.abort()

    setSkipSolana(true)
    setAppConnectionStep(AppConnectionStep.COMPLETE)
  }, [setAppConnectionStep])

  const renderFooter = useCallback(() => {
    let primary: {
      text: string | ReactNode
      onPress?: () => void
      disable?: boolean
    } = {
      text: 'Continue'
    }
    let secondary:
      | {
          text: string
          onPress?: () => void
          type?: ButtonType
          disable?: boolean
        }
      | undefined

    switch (currentAppConnectionStep) {
      case AppConnectionStep.AVALANCHE_CONNECT:
      case AppConnectionStep.AVALANCHE_LOADING:
        primary = {
          text: 'Continue',
          onPress: handleConnectAvalanche,
          disable:
            currentAppConnectionStep === AppConnectionStep.AVALANCHE_LOADING ||
            hasDeviceId === false
        }
        break
      case AppConnectionStep.SOLANA_CONNECT:
      case AppConnectionStep.SOLANA_LOADING:
        primary = {
          text: 'Continue',
          onPress: handleConnectSolana,
          disable:
            currentAppConnectionStep === AppConnectionStep.SOLANA_LOADING ||
            hasDeviceId === false
        }
        secondary = {
          text: 'Skip Solana',
          onPress: handleSkipSolana,
          type: 'secondary'
        }
        break
      case AppConnectionStep.COMPLETE:
        primary = {
          text: isUpdatingWallet ? <ActivityIndicator /> : 'Complete setup',
          onPress: () => handleComplete(multiIndexKeys),
          disable: isUpdatingWallet
        }
        if (showCancelOnComplete) {
          secondary = {
            text: 'Cancel',
            onPress: handleCancel,
            disable: isUpdatingWallet
          }
        }
        break
    }

    return (
      <View style={{ gap: 12 }}>
        <Button
          type="primary"
          size="large"
          onPress={primary?.onPress}
          disabled={primary?.disable}>
          {primary?.text}
        </Button>
        {secondary && (
          <Button
            type={secondary?.type ?? 'tertiary'}
            disabled={secondary?.disable}
            size="large"
            onPress={secondary?.onPress}>
            {secondary?.text}
          </Button>
        )}
      </View>
    )
  }, [
    currentAppConnectionStep,
    handleCancel,
    handleComplete,
    handleConnectAvalanche,
    handleConnectSolana,
    handleSkipSolana,
    hasDeviceId,
    isUpdatingWallet,
    multiIndexKeys,
    showCancelOnComplete
  ])

  const emptyKeys = { solanaKeys: [], avalancheKeys: undefined }
  const firstMainnetKey = multiIndexKeys.mainnet[accountIndex]
  const firstTestnetKey = multiIndexKeys.testnet[accountIndex]
  const displayKeys: LedgerKeysByNetwork = {
    mainnet: firstMainnetKey ?? emptyKeys,
    testnet: firstTestnetKey ?? emptyKeys
  }

  return (
    <ScrollScreen
      headerCenterOverlay={headerCenterOverlay}
      showNavigationHeaderTitle={false}
      hasParent={true}
      isModal={true}
      style={{ paddingTop: 8 }}
      renderFooter={renderFooter}
      contentContainerStyle={{
        flex:
          currentAppConnectionStep === AppConnectionStep.COMPLETE
            ? undefined
            : 1
      }}>
      <LedgerAppConnection
        completeStepTitle={completeStepTitle}
        connectedDeviceId={deviceId}
        connectedDeviceName={deviceName}
        keys={displayKeys}
        appConnectionStep={currentAppConnectionStep}
        skipSolana={skipSolana}
        derivationPathType={selectedDerivationPath}
      />
    </ScrollScreen>
  )
}

function mergeSolanaKeys(
  prev: LedgerMultiIndexKeys,
  solanaKeysRange: (PublicKeyInfo[] | null)[],
  opts: { startIndex: number; count: number }
): LedgerMultiIndexKeys {
  const updatedMainnet = { ...prev.mainnet }
  const updatedTestnet = { ...prev.testnet }

  for (let i = 0; i < opts.count; i++) {
    const idx = opts.startIndex + i
    const solKeys = solanaKeysRange[i] ?? []

    if (updatedMainnet[idx]) {
      updatedMainnet[idx] = {
        ...updatedMainnet[idx],
        solanaKeys: solKeys
      }
    }
    if (updatedTestnet[idx]) {
      updatedTestnet[idx] = {
        ...updatedTestnet[idx],
        solanaKeys: solKeys
      }
    }
  }

  return { mainnet: updatedMainnet, testnet: updatedTestnet }
}
