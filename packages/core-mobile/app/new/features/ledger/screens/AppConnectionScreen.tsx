import React, { useCallback, useState, useEffect, useMemo } from 'react'
import { useRouter } from 'expo-router'
import { Alert, Platform, View } from 'react-native'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { ProgressDots } from 'common/components/ProgressDots'
import {
  AppConnectionStep,
  LedgerAppConnection
} from 'new/features/ledger/components/LedgerAppConnection'
import { useLedgerSetupContext } from 'new/features/ledger/contexts/LedgerSetupContext'
import Logger from 'utils/Logger'
import LedgerService from 'services/ledger/LedgerService'
import { Button } from '@avalabs/k2-alpine'
import { useHeaderHeight } from '@react-navigation/elements'
import { LedgerKeys } from 'services/ledger/types'
import { selectIsSolanaSupportBlocked } from 'store/posthog'
import { useSelector } from 'react-redux'

export default function AppConnectionScreen(): JSX.Element {
  const { push, back } = useRouter()
  const [isCreatingWallet, setIsCreatingWallet] = useState(false)
  const headerHeight = useHeaderHeight()
  const isSolanaSupportBlocked = useSelector(selectIsSolanaSupportBlocked)

  // Local key state - managed only in this component
  const [keys, setKeys] = useState<LedgerKeys>({
    solanaKeys: [],
    avalancheKeys: undefined,
    bitcoinAddress: '',
    xpAddress: ''
  })

  const [currentAppConnectionStep, setAppConnectionStep] =
    useState<AppConnectionStep>(AppConnectionStep.AVALANCHE_CONNECT)

  const {
    connectedDeviceId,
    connectedDeviceName,
    selectedDerivationPath,
    resetSetup,
    disconnectDevice,
    createLedgerWallet
  } = useLedgerSetupContext()

  const handleComplete = useCallback(async () => {
    Logger.info('handleComplete called', {
      hasAvalancheKeys: !!keys.avalancheKeys,
      hasConnectedDeviceId: !!connectedDeviceId,
      hasSelectedDerivationPath: !!selectedDerivationPath,
      isCreatingWallet,
      solanaKeysCount: keys.solanaKeys?.length ?? 0
    })

    // If wallet hasn't been created yet, create it now
    if (
      keys.avalancheKeys &&
      connectedDeviceId &&
      selectedDerivationPath &&
      !isCreatingWallet
    ) {
      Logger.info('All conditions met, creating wallet...')
      setIsCreatingWallet(true)

      try {
        await createLedgerWallet({
          deviceId: connectedDeviceId,
          deviceName: connectedDeviceName,
          derivationPathType: selectedDerivationPath,
          avalancheKeys: keys.avalancheKeys,
          solanaKeys: keys.solanaKeys,
          bitcoinAddress: keys.bitcoinAddress
        })

        Logger.info(
          'Wallet created successfully, navigating to complete screen'
        )
        // Stop polling since we no longer need app detection
        LedgerService.stopAppPolling()
        // @ts-ignore TODO: make routes typesafe
        push('/accountSettings/ledger/complete')
      } catch (error) {
        Logger.error('Wallet creation failed', error)
        Alert.alert(
          'Wallet Creation Failed',
          error instanceof Error
            ? error.message
            : 'Failed to create Ledger wallet. Please try again.',
          [{ text: 'OK' }]
        )
        setIsCreatingWallet(false)
      }
    } else {
      Logger.info(
        'Wallet creation conditions not met, skipping wallet creation',
        {
          hasAvalancheKeys: !!keys.avalancheKeys,
          hasConnectedDeviceId: !!connectedDeviceId,
          hasSelectedDerivationPath: !!selectedDerivationPath,
          isCreatingWallet
        }
      )
      // @ts-ignore TODO: make routes typesafe
      push('/accountSettings/ledger/complete')
    }
  }, [
    keys.avalancheKeys,
    keys.solanaKeys,
    keys.bitcoinAddress,
    connectedDeviceId,
    selectedDerivationPath,
    isCreatingWallet,
    createLedgerWallet,
    connectedDeviceName,
    push
  ])

  const handleCancel = useCallback(async () => {
    await disconnectDevice()
    resetSetup()
    back()
  }, [disconnectDevice, resetSetup, back])

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
      if (!isCreatingWallet) {
        Logger.info('AppConnectionScreen unmounting, stopping app polling')
        LedgerService.stopAppPolling()
      }
    }
  }, [isCreatingWallet])

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

  // Handler for completing wallet creation
  const handleCompleteWallet = useCallback(() => {
    Logger.info('User clicked complete wallet button', {
      hasAvalancheKeys: !!keys.avalancheKeys,
      hasSolanaKeys: keys.solanaKeys && keys.solanaKeys.length > 0,
      solanaKeysCount: keys.solanaKeys?.length ?? 0
    })
    handleComplete()
  }, [keys, handleComplete])

  const renderFooter = useCallback(() => {
    if (currentAppConnectionStep !== AppConnectionStep.COMPLETE) {
      return null
    }
    return (
      <View style={{ paddingBottom: 8, paddingTop: 12 }}>
        <Button type="primary" size="large" onPress={handleCompleteWallet}>
          Complete Setup
        </Button>
        <View style={{ marginTop: 12 }}>
          <Button type="tertiary" size="large" onPress={handleCancel}>
            Cancel setup
          </Button>
        </View>
      </View>
    )
  }, [currentAppConnectionStep, handleCancel, handleCompleteWallet])

  return (
    <ScrollScreen
      headerCenterOverlay={headerCenterOverlay}
      showNavigationHeaderTitle={false}
      hasParent={true}
      isModal={true}
      renderFooter={renderFooter}
      contentContainerStyle={{
        flex:
          currentAppConnectionStep === AppConnectionStep.COMPLETE
            ? undefined
            : 1
      }}>
      <LedgerAppConnection
        deviceName={connectedDeviceName}
        selectedDerivationPath={selectedDerivationPath}
        isCreatingWallet={isCreatingWallet}
        connectedDeviceId={connectedDeviceId}
        connectedDeviceName={connectedDeviceName}
        setKeys={setKeys}
        keys={keys}
        setAppConnectionStep={setAppConnectionStep}
        appConnectionStep={currentAppConnectionStep}
      />
    </ScrollScreen>
  )
}
