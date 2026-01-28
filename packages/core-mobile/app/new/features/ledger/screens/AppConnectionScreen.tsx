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
import { Button, ButtonType } from '@avalabs/k2-alpine'
import { useHeaderHeight } from '@react-navigation/elements'
import { LedgerKeys } from 'services/ledger/types'
import { selectIsSolanaSupportBlocked } from 'store/posthog'
import { useDispatch, useSelector } from 'react-redux'
import { showSnackbar } from 'common/utils/toast'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { setLedgerAddresses } from 'store/account'

export default function AppConnectionScreen(): JSX.Element {
  const { push, back } = useRouter()
  const [isCreatingWallet, setIsCreatingWallet] = useState(false)
  const headerHeight = useHeaderHeight()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const isSolanaSupportBlocked = useSelector(selectIsSolanaSupportBlocked)
  const dispatch = useDispatch()

  // Local key state - managed only in this component
  const [keys, setKeys] = useState<LedgerKeys>({
    solanaKeys: [],
    avalancheKeys: undefined,
    bitcoinAddress: '',
    xpAddress: ''
  })

  const [currentAppConnectionStep, setAppConnectionStep] =
    useState<AppConnectionStep>(AppConnectionStep.AVALANCHE_CONNECT)
  const [skipSolana, setSkipSolana] = useState(false)

  const {
    connectedDeviceId,
    connectedDeviceName,
    selectedDerivationPath,
    resetSetup,
    disconnectDevice,
    createLedgerWallet
  } = useLedgerSetupContext()

  const getOppositeKeys = useCallback(async () => {
    try {
      const avalancheKeys = await LedgerService.getAvalancheKeys(
        0,
        !isDeveloperMode
      )
      const { bitcoinAddress } = await LedgerService.getBitcoinAndXPAddresses(
        0,
        !isDeveloperMode
      )

      return {
        addressBTC: bitcoinAddress,
        addressAVM: avalancheKeys.addresses.avm,
        addressPVM: avalancheKeys.addresses.pvm
      }
    } catch (err) {
      Logger.error('Failed to get opposite keys', err)
      return {
        addressBTC: '',
        addressAVM: '',
        addressPVM: ''
      }
    }
  }, [isDeveloperMode])

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
        const { walletId, accountId } = await createLedgerWallet({
          deviceId: connectedDeviceId,
          deviceName: connectedDeviceName,
          derivationPathType: selectedDerivationPath,
          avalancheKeys: keys.avalancheKeys,
          solanaKeys: keys.solanaKeys,
          bitcoinAddress: keys.bitcoinAddress
        })

        const oppositeKeys = await getOppositeKeys()

        const mainnet = isDeveloperMode
          ? oppositeKeys
          : {
              addressBTC: keys.bitcoinAddress ?? '',
              addressAVM: keys.avalancheKeys.addresses.avm,
              addressPVM: keys.avalancheKeys.addresses.pvm
            }

        const testnet = isDeveloperMode
          ? {
              addressBTC: keys.bitcoinAddress ?? '',
              addressAVM: keys.avalancheKeys.addresses.avm,
              addressPVM: keys.avalancheKeys.addresses.pvm
            }
          : oppositeKeys

        dispatch(
          setLedgerAddresses({
            [accountId]: {
              mainnet,
              testnet,
              walletId,
              index: 0,
              id: accountId
            }
          })
        )

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
    getOppositeKeys,
    isDeveloperMode,
    dispatch,
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

  const handleConnectAvalanche = useCallback(async () => {
    try {
      setAppConnectionStep(AppConnectionStep.AVALANCHE_LOADING)

      // Get keys from service
      const avalancheKeys = await LedgerService.getAvalancheKeys(
        0,
        isDeveloperMode
      )
      const { bitcoinAddress, xpAddress } =
        await LedgerService.getBitcoinAndXPAddresses(0, isDeveloperMode)

      // Update local state
      setKeys(prev => ({
        ...prev,
        avalancheKeys,
        bitcoinAddress,
        xpAddress
      }))

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
  }, [isDeveloperMode, isSolanaSupportBlocked])

  const handleConnectSolana = useCallback(async () => {
    try {
      setAppConnectionStep(AppConnectionStep.SOLANA_LOADING)

      // Get keys from service
      const solanaKeys = await LedgerService.getSolanaKeys(0)

      // Update local state
      setKeys(prev => ({
        ...prev,
        solanaKeys
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
  }, [])

  const handleSkipSolana = useCallback(() => {
    // Skip Solana and proceed to complete step
    setSkipSolana(true)
    setAppConnectionStep(AppConnectionStep.COMPLETE)
  }, [setAppConnectionStep])

  const renderFooter = useCallback(() => {
    let primary: { text: string; onPress?: () => void; disable?: boolean } = {
      text: 'Continue'
    }
    let secondary:
      | { text: string; onPress?: () => void; type?: ButtonType }
      | undefined

    switch (currentAppConnectionStep) {
      case AppConnectionStep.AVALANCHE_CONNECT:
      case AppConnectionStep.AVALANCHE_LOADING:
        primary = {
          text: 'Continue',
          onPress: handleConnectAvalanche,
          disable:
            currentAppConnectionStep === AppConnectionStep.AVALANCHE_LOADING
        }
        break
      case AppConnectionStep.SOLANA_CONNECT:
      case AppConnectionStep.SOLANA_LOADING:
        primary = {
          text: 'Continue',
          onPress: handleConnectSolana,
          disable: currentAppConnectionStep === AppConnectionStep.SOLANA_LOADING
        }
        secondary = {
          text: 'Skip Solana',
          onPress: handleSkipSolana,
          type: 'secondary'
        }
        break
      case AppConnectionStep.COMPLETE:
        primary = {
          text: 'Complete setup',
          onPress: handleCompleteWallet
        }
        secondary = {
          text: 'Cancel setup',
          onPress: handleCancel
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
    handleCompleteWallet,
    handleConnectAvalanche,
    handleConnectSolana,
    handleSkipSolana
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
        deviceName={connectedDeviceName}
        selectedDerivationPath={selectedDerivationPath}
        isCreatingWallet={isCreatingWallet}
        connectedDeviceId={connectedDeviceId}
        connectedDeviceName={connectedDeviceName}
        keys={keys}
        appConnectionStep={currentAppConnectionStep}
        skipSolana={skipSolana}
      />
    </ScrollScreen>
  )
}
