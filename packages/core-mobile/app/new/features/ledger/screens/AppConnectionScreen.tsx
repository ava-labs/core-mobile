import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { Alert, Platform } from 'react-native'
import { useTheme, View } from '@avalabs/k2-alpine'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { LedgerAppConnection } from 'new/features/ledger/components/LedgerAppConnection'
import { useLedgerSetupContext } from 'new/features/ledger/contexts/LedgerSetupContext'
import { LedgerDerivationPathType } from 'services/ledger/types'

// Animated dot component - moved outside to prevent recreation on every render
const AnimatedDot = ({
  isActive,
  dotSize,
  colors
}: {
  isActive: boolean
  dotSize: number
  colors: any
}): JSX.Element => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(isActive ? dotSize * 2 : dotSize, { duration: 200 }),
      opacity: withTiming(isActive ? 1 : 0.4, { duration: 200 })
    }
  })

  return (
    <Animated.View
      style={[
        {
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: colors.$textPrimary
        },
        animatedStyle
      ]}
    />
  )
}

// Header-compatible progress dots using k2-alpine components
const HeaderProgressDots = ({
  totalSteps,
  currentStep
}: {
  totalSteps: number
  currentStep: number
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const dotSize = 6
  const gap = 6

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap,
        justifyContent: 'center'
      }}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <AnimatedDot
          key={index}
          isActive={index === currentStep}
          dotSize={dotSize}
          colors={colors}
        />
      ))}
    </View>
  )
}

export default function AppConnectionScreen(): JSX.Element {
  const { push, back } = useRouter()
  const [isCreatingWallet, setIsCreatingWallet] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const {
    getSolanaKeys,
    getAvalancheKeys,
    connectedDeviceId,
    connectedDeviceName,
    selectedDerivationPath,
    setSelectedDerivationPath,
    setConnectedDevice,
    keys,
    resetSetup,
    disconnectDevice,
    createLedgerWallet
  } = useLedgerSetupContext()

  // Set up default values for the Ledger setup
  useEffect(() => {
    // Set default derivation path if not set
    if (!selectedDerivationPath) {
      setSelectedDerivationPath(LedgerDerivationPathType.BIP44)
    }
  }, [
    selectedDerivationPath,
    connectedDeviceId,
    keys.avalancheKeys,
    setSelectedDerivationPath,
    setConnectedDevice
  ])

  const handleComplete = useCallback(async () => {
    // If wallet hasn't been created yet, create it now
    if (
      keys.avalancheKeys &&
      connectedDeviceId &&
      selectedDerivationPath &&
      !isCreatingWallet
    ) {
      setIsCreatingWallet(true)

      try {
        await createLedgerWallet({
          deviceId: connectedDeviceId,
          deviceName: connectedDeviceName,
          derivationPathType: selectedDerivationPath
        })

        // @ts-ignore TODO: make routes typesafe
        push('/accountSettings/ledger/complete')
      } catch (error) {
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
      // @ts-ignore TODO: make routes typesafe
      push('/accountSettings/ledger/complete')
    }
  }, [
    keys.avalancheKeys,
    connectedDeviceId,
    connectedDeviceName,
    selectedDerivationPath,
    createLedgerWallet,
    push,
    isCreatingWallet
  ])

  const handleCancel = useCallback(async () => {
    await disconnectDevice()
    resetSetup()
    back()
  }, [disconnectDevice, resetSetup, back])


  const renderHeaderCenterComponent = useCallback(() => {
    console.log('🟢 renderHeaderCenterComponent called, currentStep:', currentStep, 'timestamp:', Date.now(), 'Platform:', Platform.OS)
    return <HeaderProgressDots totalSteps={3} currentStep={currentStep} />
  }, [currentStep])

  return (
    <ScrollScreen
      renderHeaderCenterComponent={renderHeaderCenterComponent}
      showNavigationHeaderTitle={false} // Hide navigation title since we have progress dots
      hasParent={true} // Modal screens need hasParent={true}
      isModal={true}
      scrollEnabled={false}
      contentContainerStyle={{ flex: 1 }}>
      <LedgerAppConnection
        onComplete={handleComplete}
        onCancel={handleCancel}
        getSolanaKeys={getSolanaKeys}
        getAvalancheKeys={getAvalancheKeys}
        deviceName={connectedDeviceName}
        selectedDerivationPath={selectedDerivationPath}
        isCreatingWallet={isCreatingWallet}
        connectedDeviceId={connectedDeviceId}
        connectedDeviceName={connectedDeviceName}
        onStepChange={setCurrentStep}
      />
    </ScrollScreen>
  )
}
