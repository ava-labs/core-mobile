import React, { useCallback, useState, useEffect, useMemo } from 'react'
import { useRouter } from 'expo-router'
import { Alert, Platform, View } from 'react-native'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { ProgressDots } from 'common/components/ProgressDots'
import {
  AppConnectionStep,
  LedgerAppConnection,
  LocalKeyState
} from 'new/features/ledger/components/LedgerAppConnection'
import { useLedgerSetupContext } from 'new/features/ledger/contexts/LedgerSetupContext'
import Logger from 'utils/Logger'
import LedgerService from 'services/ledger/LedgerService'
import { Button } from '@avalabs/k2-alpine'

export default function AppConnectionScreen(): JSX.Element {
  const { push, back } = useRouter()
  const [isCreatingWallet, setIsCreatingWallet] = useState(false)

  // Local key state - managed only in this component
  const [keys, setKeys] = useState<LocalKeyState>({
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
      solanaKeysCount: keys.solanaKeys.length
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
  }, [currentAppConnectionStep])

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
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop
        }}>
        <ProgressDots totalSteps={3} currentStep={progressDotsCurrentStep} />
      </View>
    )
  }, [progressDotsCurrentStep])

  // Handler for completing wallet creation
  const handleCompleteWallet = useCallback(() => {
    Logger.info('User clicked complete wallet button', {
      hasAvalancheKeys: !!keys.avalancheKeys,
      hasSolanaKeys: keys.solanaKeys.length > 0,
      solanaKeysCount: keys.solanaKeys.length
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
