import React, { useState, useCallback, useEffect } from 'react'
import { View } from 'react-native'
import { Text, Button, useTheme, Icons } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { LoadingState } from 'common/components/LoadingState'
import { LedgerDerivationPathType } from 'services/wallet/LedgerWallet'

type AppConnectionStep =
  | 'avalanche-connect'
  | 'avalanche-loading'
  | 'avalanche-success'
  | 'solana-connect'
  | 'solana-loading'
  | 'solana-success'
  | 'complete'

interface LedgerAppConnectionProps {
  onComplete: () => void
  onCancel: () => void
  getSolanaKeys: () => Promise<void>
  getAvalancheKeys: () => Promise<void>
  deviceName: string
  selectedDerivationPath: LedgerDerivationPathType | null
}

export const LedgerAppConnection: React.FC<LedgerAppConnectionProps> = ({
  onComplete,
  onCancel,
  getSolanaKeys,
  getAvalancheKeys,
  deviceName,
  selectedDerivationPath
}) => {
  const {
    theme: { colors }
  } = useTheme()

  const [currentStep, setCurrentStep] =
    useState<AppConnectionStep>('avalanche-connect')
  const [error, setError] = useState<string | null>(null)

  // Auto-progress through steps
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    switch (currentStep) {
      case 'avalanche-success':
        timeoutId = setTimeout(() => {
          setCurrentStep('solana-connect')
        }, 2000)
        break
      case 'solana-success':
        timeoutId = setTimeout(() => {
          setCurrentStep('complete')
        }, 2000)
        break
      case 'complete':
        timeoutId = setTimeout(() => {
          onComplete()
        }, 1500)
        break
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [currentStep, onComplete])

  const handleConnectAvalanche = useCallback(async () => {
    try {
      setError(null)
      setCurrentStep('avalanche-loading')

      await getAvalancheKeys()
      setCurrentStep('avalanche-success')
    } catch (err) {
      setError(
        'Failed to connect to Avalanche app. Please make sure the Avalanche app is open on your Ledger.'
      )
      setCurrentStep('avalanche-connect')
    }
  }, [getAvalancheKeys])

  const handleConnectSolana = useCallback(async () => {
    try {
      setError(null)
      setCurrentStep('solana-loading')

      await getSolanaKeys()
      setCurrentStep('solana-success')
    } catch (err) {
      setError(
        'Failed to connect to Solana app. Please make sure the Solana app is open on your Ledger.'
      )
      setCurrentStep('solana-connect')
    }
  }, [getSolanaKeys])

  const renderStepContent = (): React.ReactNode => {
    switch (currentStep) {
      case 'avalanche-connect':
        return (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <Icons.TokenLogos.AVAX width={64} height={64} />
            <Text
              variant="heading4"
              style={{ textAlign: 'center', marginTop: 24, marginBottom: 16 }}>
              Connect to Avalanche App
            </Text>
            <Text
              variant="body1"
              style={{
                textAlign: 'center',
                color: colors.$textSecondary,
                marginBottom: 32,
                maxWidth: 320
              }}>
              Open the Avalanche app on your {deviceName} and press continue
              when ready.
            </Text>

            {error && (
              <View
                style={{
                  backgroundColor: colors.$surfaceSecondary,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 24,
                  maxWidth: 320
                }}>
                <Text
                  variant="body2"
                  style={{ color: colors.$textDanger, textAlign: 'center' }}>
                  {error}
                </Text>
              </View>
            )}

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
        )

      case 'avalanche-loading':
        return (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <LoadingState sx={{ marginBottom: 24 }} />
            <Text
              variant="heading4"
              style={{ textAlign: 'center', marginBottom: 16 }}>
              Connecting to Avalanche
            </Text>
            <Text
              variant="body1"
              style={{
                textAlign: 'center',
                color: colors.$textSecondary,
                maxWidth: 320
              }}>
              Please confirm the connection on your {deviceName}. We're
              retrieving your Avalanche addresses...
            </Text>
          </View>
        )

      case 'avalanche-success':
        return (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colors.$accentSuccessL,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24
              }}>
              <Icons.Action.CheckCircle
                color={colors.$white}
                width={32}
                height={32}
              />
            </View>
            <Text
              variant="heading4"
              style={{ textAlign: 'center', marginBottom: 16 }}>
              Avalanche Connected!
            </Text>
            <Text
              variant="body1"
              style={{
                textAlign: 'center',
                color: colors.$textSecondary,
                maxWidth: 320
              }}>
              Successfully retrieved your Avalanche addresses. Now let's connect
              to Solana...
            </Text>
          </View>
        )

      case 'solana-connect':
        return (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <Icons.TokenLogos.SOL width={64} height={64} />
            <Text
              variant="heading4"
              style={{ textAlign: 'center', marginTop: 24, marginBottom: 16 }}>
              Connect to Solana App
            </Text>
            <Text
              variant="body1"
              style={{
                textAlign: 'center',
                color: colors.$textSecondary,
                marginBottom: 32,
                maxWidth: 320
              }}>
              Close the Avalanche app and open the Solana app on your{' '}
              {deviceName}, then press continue.
            </Text>

            {error && (
              <View
                style={{
                  backgroundColor: colors.$surfaceSecondary,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 24,
                  maxWidth: 320
                }}>
                <Text
                  variant="body2"
                  style={{ color: colors.$textDanger, textAlign: 'center' }}>
                  {error}
                </Text>
              </View>
            )}

            <Button
              type="primary"
              size="large"
              onPress={handleConnectSolana}
              style={{ marginBottom: 16 }}>
              Continue
            </Button>

            <Button type="tertiary" size="large" onPress={onCancel}>
              Cancel Setup
            </Button>
          </View>
        )

      case 'solana-loading':
        return (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <LoadingState sx={{ marginBottom: 24 }} />
            <Text
              variant="heading4"
              style={{ textAlign: 'center', marginBottom: 16 }}>
              Connecting to Solana
            </Text>
            <Text
              variant="body1"
              style={{
                textAlign: 'center',
                color: colors.$textSecondary,
                maxWidth: 320
              }}>
              Please confirm the connection on your {deviceName}. We're
              retrieving your Solana addresses...
            </Text>
          </View>
        )

      case 'solana-success':
        return (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colors.$accentSuccessL,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24
              }}>
              <Icons.Action.CheckCircle
                color={colors.$white}
                width={32}
                height={32}
              />
            </View>
            <Text
              variant="heading4"
              style={{ textAlign: 'center', marginBottom: 16 }}>
              Solana Connected!
            </Text>
            <Text
              variant="body1"
              style={{
                textAlign: 'center',
                color: colors.$textSecondary,
                maxWidth: 320
              }}>
              Successfully retrieved your Solana addresses. Setting up your
              wallet...
            </Text>
          </View>
        )

      case 'complete':
        return (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colors.$accentSuccessL,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24
              }}>
              <Icons.Action.CheckCircle
                color={colors.$white}
                width={32}
                height={32}
              />
            </View>
            <Text
              variant="heading4"
              style={{ textAlign: 'center', marginBottom: 16 }}>
              Apps Connected!
            </Text>
            <Text
              variant="body1"
              style={{
                textAlign: 'center',
                color: colors.$textSecondary,
                maxWidth: 320
              }}>
              Both Avalanche and Solana apps are connected. Proceeding to wallet
              setup...
            </Text>
          </View>
        )

      default:
        return null
    }
  }

  const getProgressText = (): string => {
    const pathType =
      selectedDerivationPath === LedgerDerivationPathType.LedgerLive
        ? 'Ledger Live'
        : 'BIP44'

    switch (currentStep) {
      case 'avalanche-connect':
      case 'avalanche-loading':
      case 'avalanche-success':
        return `Step 1 of 2: Avalanche (${pathType})`
      case 'solana-connect':
      case 'solana-loading':
      case 'solana-success':
        return `Step 2 of 2: Solana (${pathType})`
      case 'complete':
        return `Complete (${pathType})`
      default:
        return ''
    }
  }

  return (
    <ScrollScreen
      title="Connect Ledger Apps"
      subtitle={getProgressText()}
      isModal
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        {renderStepContent()}
      </View>
    </ScrollScreen>
  )
}
