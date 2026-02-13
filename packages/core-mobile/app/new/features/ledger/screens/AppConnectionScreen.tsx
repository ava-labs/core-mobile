import React, {
  useCallback,
  useState,
  useEffect,
  useMemo,
  ReactNode
} from 'react'
import { useRouter } from 'expo-router'
import { Alert, Platform, View } from 'react-native'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { ProgressDots } from 'common/components/ProgressDots'
import {
  AppConnectionStep,
  LedgerAppConnection
} from 'new/features/ledger/components/LedgerAppConnection'
import Logger from 'utils/Logger'
import LedgerService from 'services/ledger/LedgerService'
import { ActivityIndicator, Button, ButtonType } from '@avalabs/k2-alpine'
import { useHeaderHeight } from '@react-navigation/elements'
import { LedgerKeysByNetwork } from 'services/ledger/types'
import { selectIsSolanaSupportBlocked } from 'store/posthog'
import { useSelector } from 'react-redux'
import { showSnackbar } from 'common/utils/toast'
import { selectIsDeveloperMode } from 'store/settings/advanced'

export default function AppConnectionScreen({
  completeStepTitle,
  isUpdatingWallet,
  handleComplete,
  deviceId,
  deviceName = 'Ledger Device',
  disconnectDevice,
  accountIndex
}: {
  completeStepTitle: string
  isUpdatingWallet: boolean
  deviceId?: string | null
  deviceName?: string
  disconnectDevice: () => Promise<void>
  handleComplete: (keys: LedgerKeysByNetwork) => Promise<void>
  accountIndex: number
}): JSX.Element {
  const { back } = useRouter()
  const headerHeight = useHeaderHeight()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const isSolanaSupportBlocked = useSelector(selectIsSolanaSupportBlocked)

  const hasDeviceId = !!deviceId

  // Local key state - managed only in this component
  const [keys, setKeys] = useState<LedgerKeysByNetwork>({
    mainnet: {
      solanaKeys: [],
      avalancheKeys: undefined
    },
    testnet: {
      solanaKeys: [],
      avalancheKeys: undefined
    }
  })

  const [currentAppConnectionStep, setAppConnectionStep] =
    useState<AppConnectionStep>(AppConnectionStep.AVALANCHE_CONNECT)
  const [skipSolana, setSkipSolana] = useState(false)

  const handleCancel = useCallback(async () => {
    await disconnectDevice()
    back()
  }, [disconnectDevice, back])

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

  // Cleanup: Stop polling when component unmounts (unless wallet creation is in progress)
  useEffect(() => {
    return () => {
      // Only stop polling if we're not in the middle of wallet creation
      // If wallet creation succeeded, the connection should remain for the wallet to use
      if (!isUpdatingWallet) {
        Logger.info('AppConnectionScreen unmounting, stopping app polling')
        LedgerService.stopAppPolling()
      }
    }
  }, [isUpdatingWallet])

  const headerCenterOverlay = useMemo(() => {
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
  }, [headerHeight, isSolanaSupportBlocked, progressDotsCurrentStep])

  const handleConnectAvalanche = useCallback(async () => {
    try {
      if (!deviceId) {
        throw new Error('No device ID found')
      }
      await LedgerService.ensureConnection(deviceId)
      setAppConnectionStep(AppConnectionStep.AVALANCHE_LOADING)

      // Get keys from service
      const avalancheKeys = await LedgerService.getAvalancheKeys(
        accountIndex,
        isDeveloperMode
      )
      const oppositeAvalancheKeys = await LedgerService.getAvalancheKeys(
        accountIndex,
        !isDeveloperMode
      )

      // Update local state
      setKeys({
        mainnet: {
          avalancheKeys: isDeveloperMode
            ? oppositeAvalancheKeys
            : avalancheKeys,
          solanaKeys: []
        },
        testnet: {
          avalancheKeys: isDeveloperMode
            ? avalancheKeys
            : oppositeAvalancheKeys,
          solanaKeys: []
        }
      })

      // Show success toast notification
      showSnackbar('Avalanche app connected')
      // if get avalanche keys succeeds move forward to solana connect
      setAppConnectionStep(
        isSolanaSupportBlocked
          ? AppConnectionStep.COMPLETE
          : AppConnectionStep.SOLANA_CONNECT
      )
    } catch (err) {
      Logger.error('Failed to connect to Avalanche app', err)
      setAppConnectionStep(AppConnectionStep.AVALANCHE_CONNECT)
      Alert.alert(
        'Connection Failed',
        'Failed to connect to Avalanche app. Please make sure the Avalanche app is open on your Ledger.',
        [{ text: 'OK' }]
      )
    }
  }, [accountIndex, deviceId, isDeveloperMode, isSolanaSupportBlocked])

  const handleConnectSolana = useCallback(async () => {
    try {
      if (!deviceId) {
        throw new Error('No device ID found')
      }
      await LedgerService.ensureConnection(deviceId)
      setAppConnectionStep(AppConnectionStep.SOLANA_LOADING)

      // Get keys from service
      const solanaKeys = await LedgerService.getSolanaKeys(accountIndex)

      // Update local state
      setKeys(prev => ({
        ...prev,
        mainnet: {
          ...prev.mainnet,
          solanaKeys
        },
        testnet: {
          ...prev.testnet,
          solanaKeys
        }
      }))

      // Show success toast notification
      showSnackbar('Solana app connected')

      // Skip success step and go directly to complete
      setAppConnectionStep(AppConnectionStep.COMPLETE)
    } catch (err) {
      Logger.error('Failed to connect to Solana app', err)
      setAppConnectionStep(AppConnectionStep.SOLANA_CONNECT)
      Alert.alert(
        'Connection Failed',
        'Failed to connect to Solana app. Please make sure the Solana app is installed and open on your Ledger.',
        [{ text: 'OK' }]
      )
    }
  }, [accountIndex, deviceId])

  const handleSkipSolana = useCallback(() => {
    // Skip Solana and proceed to complete step
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
          onPress: () => handleComplete(keys),
          disable: isUpdatingWallet
        }
        secondary = {
          text: 'Cancel',
          onPress: handleCancel,
          disable: isUpdatingWallet
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
    keys
  ])

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
        keys={keys}
        appConnectionStep={currentAppConnectionStep}
        skipSolana={skipSolana}
      />
    </ScrollScreen>
  )
}
