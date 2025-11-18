import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { View, ScrollView } from 'react-native'
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
  const [error, setError] = useState<string | null>(null)

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
      setError(null)
      setCurrentStep(AppConnectionStep.AVALANCHE_LOADING)

      await getAvalancheKeys()
      // Skip success step and go directly to Solana connect
      setCurrentStep(AppConnectionStep.SOLANA_CONNECT)
    } catch (err) {
      setError(
        'Failed to connect to Avalanche app. Please make sure the Avalanche app is open on your Ledger.'
      )
      setCurrentStep(AppConnectionStep.AVALANCHE_CONNECT)
    }
  }, [getAvalancheKeys])

  const handleConnectSolana = useCallback(async () => {
    try {
      setError(null)
      setCurrentStep(AppConnectionStep.SOLANA_LOADING)

      await getSolanaKeys()
      
      // Skip success step and go directly to complete
      setCurrentStep(AppConnectionStep.COMPLETE)
    } catch (err) {
      setError(
        'Failed to connect to Solana app. Please make sure the Solana app is open on your Ledger.'
      )
      setCurrentStep(AppConnectionStep.SOLANA_CONNECT)
    }
  }, [getSolanaKeys])

  const handleSkipSolana = useCallback(() => {
    // Skip Solana and proceed to complete step
    setCurrentStep(AppConnectionStep.COMPLETE)
  }, [])

  const renderStepContent = (): React.ReactNode => {
    switch (currentStep) {
      case AppConnectionStep.AVALANCHE_CONNECT:
        return (
          <View style={{ flex: 1 }}>
            <AnimatedIconWithText
              icon={
                <Icons.Custom.Avalanche
                  width={44}
                  height={40}
                  color={colors.$textPrimary}
                />
              }
              title="Connect to Avalanche App"
              subtitle={`Open the Avalanche app on your ${deviceName} and press continue when ready.`}
              showAnimation={false}
            />

            {error && (
              <View
                style={{
                  backgroundColor: colors.$surfaceSecondary,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 24,
                  marginHorizontal: 32,
                  marginTop: 'auto'
                }}>
                <Text
                  variant="body2"
                  style={{ color: colors.$textDanger, textAlign: 'center' }}>
                  {error}
                </Text>
              </View>
            )}

            <View
              style={{
                marginTop: error ? 0 : 'auto',
                paddingHorizontal: 32,
                paddingBottom: 32
              }}>
              <Button
                type="primary"
                size="large"
                onPress={handleConnectAvalanche}
                style={{ marginBottom: 16 }}>
                Continue
              </Button>

              <Button type="tertiary" size="large" onPress={onCancel}>
                Cancel Setup
              </Button>
            </View>
          </View>
        )

      case AppConnectionStep.AVALANCHE_LOADING:
        return (
          <View style={{ flex: 1 }}>
            <AnimatedIconWithText
              icon={
                <Icons.Custom.Avalanche
                  width={44}
                  height={40}
                  color={colors.$textPrimary}
                />
              }
              title="Connecting to Avalanche"
              subtitle={`Please confirm the connection on your ${deviceName}. We're retrieving your Avalanche addresses...`}
              showAnimation={true}
            />
          </View>
        )

      case AppConnectionStep.SOLANA_CONNECT:
        return (
          <View style={{ flex: 1 }}>
            <AnimatedIconWithText
              icon={
                <Icons.Custom.Solana
                  width={40}
                  height={32}
                  color={colors.$textPrimary}
                />
              }
              title="Connect to Solana App"
              subtitle={`Close the Avalanche app and open the Solana app on your ${deviceName}, then press continue.`}
              showAnimation={false}
            />

            {error && (
              <View
                style={{
                  backgroundColor: colors.$surfaceSecondary,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 24,
                  marginHorizontal: 32,
                  marginTop: 'auto'
                }}>
                <Text
                  variant="body2"
                  style={{ color: colors.$textDanger, textAlign: 'center' }}>
                  {error}
                </Text>
              </View>
            )}

            <View
              style={{
                marginTop: error ? 0 : 'auto',
                paddingHorizontal: 32,
                paddingBottom: 32
              }}>
              <Button
                type="primary"
                size="large"
                onPress={handleConnectSolana}
                style={{ marginBottom: 16 }}>
                Continue
              </Button>

              <Button type="tertiary" size="large" onPress={handleSkipSolana}>
                Skip Solana
              </Button>
            </View>
          </View>
        )

      case AppConnectionStep.SOLANA_LOADING:
        return (
          <View style={{ flex: 1 }}>
            <AnimatedIconWithText
              icon={
                <Icons.Custom.Solana
                  width={40}
                  height={32}
                  color={colors.$textPrimary}
                />
              }
              title="Connecting to Solana"
              subtitle={`Please confirm the connection on your ${deviceName}. We're retrieving your Solana addresses...`}
              showAnimation={true}
            />
          </View>
        )

      case AppConnectionStep.COMPLETE:
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

      default:
        return null
    }
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
          paddingTop: insets.top,
          paddingHorizontal: 16,
          paddingVertical: 12,
          alignItems: 'center'
        }}>
        <ProgressDots totalSteps={3} currentStep={progressDotsCurrentStep} />
      </View>

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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flex: 1,
          padding: 16,
          justifyContent: 'center'
        }}>
        {renderStepContent()}
      </ScrollView>
    </View>
  )
}
