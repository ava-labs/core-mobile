import React, { useState, useCallback, useEffect } from 'react'
import { View } from 'react-native'
import { Text, Button, useTheme, Icons } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { LoadingState } from 'common/components/LoadingState'
import { LedgerDerivationPathType } from 'services/ledger/types'

enum AppConnectionStep {
  AVALANCHE_CONNECT = 'avalanche-connect',
  AVALANCHE_LOADING = 'avalanche-loading',
  AVALANCHE_SUCCESS = 'avalanche-success',
  SOLANA_CONNECT = 'solana-connect',
  SOLANA_LOADING = 'solana-loading',
  SOLANA_SUCCESS = 'solana-success',
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
}

export const LedgerAppConnection: React.FC<LedgerAppConnectionProps> = ({
  onComplete,
  onCancel,
  getSolanaKeys,
  getAvalancheKeys,
  deviceName,
  selectedDerivationPath,
  isCreatingWallet = false
}) => {
  const {
    theme: { colors }
  } = useTheme()

  const [currentStep, setCurrentStep] = useState<AppConnectionStep>(
    AppConnectionStep.AVALANCHE_CONNECT
  )
  const [error, setError] = useState<string | null>(null)

  // Auto-progress through steps
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    switch (currentStep) {
      case AppConnectionStep.AVALANCHE_SUCCESS:
        timeoutId = setTimeout(() => {
          setCurrentStep(AppConnectionStep.SOLANA_CONNECT)
        }, 2000)
        break
      case AppConnectionStep.SOLANA_SUCCESS:
        timeoutId = setTimeout(() => {
          setCurrentStep(AppConnectionStep.COMPLETE)
        }, 2000)
        break
      case AppConnectionStep.COMPLETE:
        // Don't auto-navigate if wallet is being created
        if (!isCreatingWallet) {
          timeoutId = setTimeout(() => {
            onComplete()
          }, 1500)
        }
        break
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [currentStep, onComplete, isCreatingWallet])

  const handleConnectAvalanche = useCallback(async () => {
    try {
      setError(null)
      setCurrentStep(AppConnectionStep.AVALANCHE_LOADING)

      await getAvalancheKeys()
      setCurrentStep(AppConnectionStep.AVALANCHE_SUCCESS)
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
      setCurrentStep(AppConnectionStep.SOLANA_SUCCESS)
    } catch (err) {
      setError(
        'Failed to connect to Solana app. Please make sure the Solana app is open on your Ledger.'
      )
      setCurrentStep(AppConnectionStep.SOLANA_CONNECT)
    }
  }, [getSolanaKeys])

  const renderStepContent = (): React.ReactNode => {
    switch (currentStep) {
      case AppConnectionStep.AVALANCHE_CONNECT:
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

      case AppConnectionStep.AVALANCHE_LOADING:
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

      case AppConnectionStep.AVALANCHE_SUCCESS:
        return (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colors.$textSuccess,
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

      case AppConnectionStep.SOLANA_CONNECT:
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

      case AppConnectionStep.SOLANA_LOADING:
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

      case AppConnectionStep.SOLANA_SUCCESS:
        return (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colors.$textSuccess,
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

      case AppConnectionStep.COMPLETE:
        return (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            {isCreatingWallet ? (
              <>
                <LoadingState sx={{ marginBottom: 24 }} />
                <Text
                  variant="heading4"
                  style={{ textAlign: 'center', marginBottom: 16 }}>
                  Creating Wallet...
                </Text>
                <Text
                  variant="body1"
                  style={{
                    textAlign: 'center',
                    color: colors.$textSecondary,
                    maxWidth: 320
                  }}>
                  Setting up your Ledger wallet. This may take a moment...
                </Text>
              </>
            ) : (
              <>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: colors.$textSuccess,
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
              </>
            )}
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
      case AppConnectionStep.AVALANCHE_CONNECT:
      case AppConnectionStep.AVALANCHE_LOADING:
      case AppConnectionStep.AVALANCHE_SUCCESS:
        return `Step 1 of 2: Avalanche (${pathType})`
      case AppConnectionStep.SOLANA_CONNECT:
      case AppConnectionStep.SOLANA_LOADING:
      case AppConnectionStep.SOLANA_SUCCESS:
        return `Step 2 of 2: Solana (${pathType})`
      case AppConnectionStep.COMPLETE:
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
