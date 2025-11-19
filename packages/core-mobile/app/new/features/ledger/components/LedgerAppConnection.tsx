import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { View, Platform, Alert, ActivityIndicator } from 'react-native'
import { Text, Button, useTheme, Icons, GroupList } from '@avalabs/k2-alpine'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ProgressDots } from 'common/components/ProgressDots'
import { LoadingState } from 'common/components/LoadingState'
import { LedgerDerivationPathType } from 'services/ledger/types'
import { AnimatedIconWithText } from './AnimatedIconWithText'
import { LedgerDeviceList } from './LedgerDeviceList'

enum AppConnectionStep {
  AVALANCHE_CONNECT = 'avalanche-connect',
  AVALANCHE_LOADING = 'avalanche-loading',
  SOLANA_CONNECT = 'solana-connect',
  SOLANA_LOADING = 'solana-loading',
  COMPLETE = 'complete'
}

interface StepConfig {
  icon: React.ReactNode
  title: string
  subtitle: string
  primaryButton?: {
    text: string
    onPress: () => void
  }
  secondaryButton?: {
    text: string
    onPress: () => void
  }
  showAnimation?: boolean
  isLoading?: boolean
}

interface LedgerAppConnectionProps {
  onComplete: () => void
  onCancel: () => void
  getSolanaKeys: () => Promise<void>
  getAvalancheKeys: () => Promise<void>
  deviceName: string
  selectedDerivationPath: LedgerDerivationPathType | null
  isCreatingWallet?: boolean
  connectedDeviceId?: string | null
  connectedDeviceName?: string
}

export const LedgerAppConnection: React.FC<LedgerAppConnectionProps> = ({
  onComplete,
  onCancel,
  getSolanaKeys,
  getAvalancheKeys,
  deviceName,
  selectedDerivationPath: _selectedDerivationPath,
  isCreatingWallet = false,
  connectedDeviceId,
  connectedDeviceName
}) => {
  const {
    theme: { colors }
  } = useTheme()
  const insets = useSafeAreaInsets()

  const [currentStep, setCurrentStep] = useState<AppConnectionStep>(
    AppConnectionStep.AVALANCHE_CONNECT
  )

  // Auto-progress through steps
  useEffect(() => {
    if (currentStep === AppConnectionStep.COMPLETE && !isCreatingWallet) {
      const timeoutId = setTimeout(() => {
        onComplete()
      }, 1500)

      return () => {
        clearTimeout(timeoutId)
      }
    }
  }, [currentStep, onComplete, isCreatingWallet])

  const handleConnectAvalanche = useCallback(async () => {
    try {
      setCurrentStep(AppConnectionStep.AVALANCHE_LOADING)
      await getAvalancheKeys()

      // if get avalanche keys succeeds move forward to solana connect
      setCurrentStep(AppConnectionStep.SOLANA_CONNECT)
    } catch (err) {
      setCurrentStep(AppConnectionStep.AVALANCHE_CONNECT)
      Alert.alert(
        'Connection Failed',
        'Failed to connect to Avalanche app. Please make sure the Avalanche app is open on your Ledger.',
        [{ text: 'OK' }]
      )
    }
  }, [getAvalancheKeys])

  const handleConnectSolana = useCallback(async () => {
    try {
      setCurrentStep(AppConnectionStep.SOLANA_LOADING)

      await getSolanaKeys()

      // Skip success step and go directly to complete
      setCurrentStep(AppConnectionStep.COMPLETE)
    } catch (err) {
      setCurrentStep(AppConnectionStep.SOLANA_CONNECT)
      Alert.alert(
        'Connection Failed',
        'Failed to connect to Solana app. Please make sure the Solana app is installed and open on your Ledger.',
        [{ text: 'OK' }]
      )
    }
  }, [getSolanaKeys])

  const handleSkipSolana = useCallback(() => {
    // Skip Solana and proceed to complete step
    setCurrentStep(AppConnectionStep.COMPLETE)
  }, [])

  // Step configurations
  const getStepConfig = (step: AppConnectionStep): StepConfig | null => {
    switch (step) {
      case AppConnectionStep.AVALANCHE_CONNECT:
        return {
          icon: (
            <Icons.Custom.Avalanche
              width={44}
              height={40}
              color={colors.$textPrimary}
            />
          ),
          title: 'Connect to Avalanche App',
          subtitle: `Open the Avalanche app on your ${deviceName}, then press Continue when ready.`,
          primaryButton: {
            text: 'Continue',
            onPress: handleConnectAvalanche
          },
          secondaryButton: {
            text: 'Cancel Setup',
            onPress: onCancel
          },
          showAnimation: false
        }

      case AppConnectionStep.AVALANCHE_LOADING:
        return {
          icon: (
            <Icons.Custom.Avalanche
              width={44}
              height={40}
              color={colors.$textPrimary}
            />
          ),
          title: 'Connecting to Avalanche app',
          subtitle: `Please keep your Avalanche app open on your ${deviceName}, We're retrieving your Avalanche addresses...`,
          secondaryButton: {
            text: 'Cancel Setup',
            onPress: onCancel
          },
          showAnimation: true,
          isLoading: true
        }

      case AppConnectionStep.SOLANA_CONNECT:
        return {
          icon: (
            <Icons.Custom.Solana
              width={40}
              height={32}
              color={colors.$textPrimary}
            />
          ),
          title: 'Connect to Solana App',
          subtitle: `Close the Avalanche app and open the Solana app on your ${deviceName}, then press Continue when ready.`,
          primaryButton: {
            text: 'Continue',
            onPress: handleConnectSolana
          },
          secondaryButton: {
            text: 'Skip Solana',
            onPress: handleSkipSolana
          },
          showAnimation: false
        }

      case AppConnectionStep.SOLANA_LOADING:
        return {
          icon: (
            <Icons.Custom.Solana
              width={40}
              height={32}
              color={colors.$textPrimary}
            />
          ),
          title: 'Connecting to Solana',
          subtitle: `Please keep your Solana app open on your ${deviceName}, We're retrieving your Solana address...`,
          secondaryButton: {
            text: 'Cancel Setup',
            onPress: onCancel
          },
          showAnimation: true,
          isLoading: true
        }

      default:
        return null
    }
  }

  const renderStepContent = (): React.ReactNode => {
    // Handle COMPLETE step separately as it has unique layout
    if (currentStep === AppConnectionStep.COMPLETE) {
      return (
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          {/* Header with refresh icon and title */}
          <View style={{ alignItems: 'center', paddingVertical: 32 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.$surfaceSecondary,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24
              }}>
              <Icons.Action.CheckCircle
                color={colors.$textPrimary}
                width={40}
                height={40}
              />
            </View>

            <Text
              variant="heading3"
              style={{ textAlign: 'center', marginBottom: 8 }}>
              Your Ledger wallet
            </Text>
            <Text
              variant="heading3"
              style={{ textAlign: 'center', marginBottom: 16 }}>
              is being set up
            </Text>

            <Text
              variant="body1"
              style={{
                textAlign: 'center',
                color: colors.$textSecondary,
                maxWidth: 280,
                lineHeight: 20
              }}>
              The BIP44 setup is in progress and should take about 15 seconds.
              Keep your device connected during setup.
            </Text>
          </View>

          {/* Setup progress list */}
          <View style={{ flex: 1, marginTop: 32 }}>
            <GroupList
              data={[
                {
                  title: 'Lorem ipsum dolor',
                  rightIcon: (
                    <Icons.Action.CheckCircle
                      color={colors.$textSuccess}
                      width={24}
                      height={24}
                    />
                  )
                },
                {
                  title: 'Sit amet lorem ipsum',
                  rightIcon: (
                    <Icons.Action.CheckCircle
                      color={colors.$textSuccess}
                      width={24}
                      height={24}
                    />
                  )
                },
                {
                  title: 'Storing wallet data',
                  rightIcon: <LoadingState />
                }
              ]}
              itemHeight={56}
            />
          </View>

          {/* Cancel button */}
          <View style={{ paddingBottom: 32, paddingTop: 16 }}>
            <Button type="tertiary" size="large" onPress={onCancel}>
              Cancel setup
            </Button>
          </View>
        </View>
      )
    }

    // Use template for all other steps
    const config = getStepConfig(currentStep)
    if (!config) {
      return null
    }

    // Render step using inline template logic
    if (config.isLoading) {
      return (
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <AnimatedIconWithText
              icon={config.icon}
              title={config.title}
              subtitle={config.subtitle}
              showAnimation={config.showAnimation ?? false}
            />
          </View>

          <View>
            <View style={{ paddingHorizontal: 32, paddingBottom: 32 }}>
              <View
                style={{
                  height: 48,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 12,
                  marginBottom: 16
                }}>
                <ActivityIndicator size="small" color={colors.$textPrimary} />
              </View>

              {config.secondaryButton && (
                <Button
                  type="tertiary"
                  size="large"
                  onPress={config.secondaryButton.onPress}>
                  {config.secondaryButton.text}
                </Button>
              )}
            </View>
          </View>
        </View>
      )
    }

    // Non-loading step
    return (
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <View style={{ height: 300, justifyContent: 'center' }}>
          <View style={{ alignItems: 'center', paddingHorizontal: 32 }}>
            {config.icon}
            <Text
              variant="heading6"
              style={{
                textAlign: 'center',
                marginTop: 24,
                marginBottom: 8
              }}>
              {config.title}
            </Text>
            <Text
              variant="body1"
              style={{
                textAlign: 'center',
                color: colors.$textSecondary,
                maxWidth: 280
              }}>
              {config.subtitle}
            </Text>
          </View>
        </View>

        <View>
          <View style={{ paddingHorizontal: 32, paddingBottom: 32 }}>
            {config.primaryButton && (
              <Button
                type="primary"
                size="large"
                onPress={config.primaryButton.onPress}
                style={{ marginBottom: 16 }}>
                {config.primaryButton.text}
              </Button>
            )}

            {config.secondaryButton && (
              <Button
                type="tertiary"
                size="large"
                onPress={config.secondaryButton.onPress}>
                {config.secondaryButton.text}
              </Button>
            )}
          </View>
        </View>
      </View>
    )
  }

  const progressDotsCurrentStep = useMemo(() => {
    switch (currentStep) {
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
  }, [currentStep])

  // Create device object for display
  const connectedDevice = connectedDeviceId
    ? [{ id: connectedDeviceId, name: connectedDeviceName || deviceName }]
    : []

  return (
    <View style={{ flex: 1, backgroundColor: colors.$surfacePrimary }}>
      <View
        style={{
          position: 'absolute',
          top: Platform.OS === 'ios' ? insets.top - 32 : insets.top + 12, // Adjust this value to align with back button
          left: 0,
          right: 0,
          height: 32,
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10
        }}>
        <ProgressDots totalSteps={3} currentStep={progressDotsCurrentStep} />
      </View>

      {/* Content with top padding to avoid overlap */}
      <View style={{ flex: 1, paddingTop: insets.top + 56 }}>
        {/* Show connected device */}
        {connectedDevice.length > 0 && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <LedgerDeviceList
              devices={connectedDevice}
              subtitleText="Connected via Bluetooth"
              testID="connected_device_list"
            />
          </View>
        )}

        <View style={{ flex: 1, padding: 16 }}>{renderStepContent()}</View>
      </View>
    </View>
  )
}
