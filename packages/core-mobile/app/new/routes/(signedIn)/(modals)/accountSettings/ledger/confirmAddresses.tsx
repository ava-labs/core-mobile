import React, { useState, useCallback, useEffect } from 'react'
import { Alert } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import {
  View,
  Text,
  Button,
  Card,
  Icons,
  useTheme,
  CircularProgress
} from '@avalabs/k2-alpine'
import { LoadingState } from 'new/common/components/LoadingState'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useLedgerWallet } from 'new/features/ledger/hooks/useLedgerWallet'

export default function ConfirmAddresses() {
  const params = useLocalSearchParams<{
    deviceId: string
    deviceName: string
  }>()
  const [step, setStep] = useState<
    'connecting' | 'solana' | 'avalanche' | 'complete'
  >('connecting')
  const router = useRouter()
  const {
    theme: { colors }
  } = useTheme()
  const {
    isLoading,
    keys: { solanaKeys, avalancheKeys, bitcoinAddress, xpAddress },
    connectToDevice,
    getSolanaKeys,
    getAvalancheKeys,
    createLedgerWallet
  } = useLedgerWallet()

  // Track key retrieval states
  const [solanaKeyState, setSolanaKeyState] = useState<
    'pending' | 'success' | 'error'
  >('pending')
  const [avalancheKeyState, setAvalancheKeyState] = useState<
    'pending' | 'success' | 'error'
  >('pending')

  // Handle Solana key retrieval and app switching
  const handleSolanaKeys = useCallback(async () => {
    try {
      setSolanaKeyState('pending')

      // Add a small delay to ensure app is ready
      await new Promise(resolve => setTimeout(resolve, 1000))

      try {
        await getSolanaKeys()
        setSolanaKeyState('success')
        promptForAvalancheSwitch()
      } catch (error) {
        // Check if it's a specific Solana app error
        if (error instanceof Error) {
          if (
            error.message.includes('Solana app is not ready') ||
            error.message.includes('Solana app is not open')
          ) {
            setSolanaKeyState('error')
            Alert.alert(
              'Solana App Required',
              'Please open the Solana app on your Ledger device, then tap "I\'ve Switched" when ready.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: "I've Switched",
                  onPress: () => {
                    setSolanaKeyState('pending')
                    handleSolanaKeys()
                  }
                }
              ]
            )
            return
          }

          if (error.message.includes('Operation was rejected')) {
            setSolanaKeyState('error')
            Alert.alert(
              'Operation Rejected',
              'The operation was rejected on your Ledger device. Please try again.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Retry',
                  onPress: () => {
                    setSolanaKeyState('pending')
                    handleSolanaKeys()
                  }
                }
              ]
            )
            return
          }
        }

        // For other errors, show a generic error message
        setSolanaKeyState('error')
        Alert.alert(
          'Error',
          'Failed to get Solana keys. Please ensure the Solana app is open and try again.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Retry',
              onPress: () => {
                setSolanaKeyState('pending')
                handleSolanaKeys()
              }
            }
          ]
        )
      }
    } catch (error) {
      setSolanaKeyState('error')
      Alert.alert('Error', 'An unexpected error occurred. Please try again.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Retry',
          onPress: () => {
            setSolanaKeyState('pending')
            handleSolanaKeys()
          }
        }
      ])
    }
  }, [getSolanaKeys, promptForAvalancheSwitch])

  // Prompt for Avalanche app switch
  const promptForAvalancheSwitch = useCallback(() => {
    Alert.alert(
      'Switch to Avalanche App',
      'Please switch to the Avalanche app on your Ledger device, then tap "I\'ve Switched" to continue.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: "I've Switched",
          onPress: async () => {
            try {
              setStep('avalanche')
              setAvalancheKeyState('pending')
              await getAvalancheKeys()
              setAvalancheKeyState('success')
              setStep('complete')
            } catch (error) {
              setAvalancheKeyState('error')
              Alert.alert(
                'Avalanche App Required',
                'Please ensure the Avalanche app is open on your Ledger device, then tap "Retry".',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Retry',
                    onPress: () => {
                      setAvalancheKeyState('pending')
                      promptForAvalancheSwitch()
                    }
                  }
                ]
              )
            }
          }
        }
      ]
    )
  }, [getAvalancheKeys])

  // Initial connection and setup
  const handleInitialSetup = useCallback(async () => {
    try {
      await connectToDevice(params.deviceId)
      setStep('solana')
      await handleSolanaKeys()
    } catch (error) {
      Alert.alert(
        'Connection Failed',
        'Failed to connect to Ledger device. Please ensure your device is unlocked and try again.',
        [{ text: 'OK' }]
      )
    }
  }, [connectToDevice, params.deviceId, handleSolanaKeys])

  // Handle wallet creation
  const handleCreateWallet = useCallback(async () => {
    try {
      const walletId = await createLedgerWallet({
        deviceId: params.deviceId,
        deviceName: params.deviceName || 'Ledger Device'
      })
      if (walletId) {
        router.push('/accountSettings/manageAccounts')
      }
    } catch (error) {
      Alert.alert(
        'Wallet Creation Failed',
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }, [createLedgerWallet, params.deviceId, params.deviceName, router])

  useEffect(() => {
    if (params.deviceId) {
      handleInitialSetup()
    } else {
      Alert.alert('Error', 'No device ID provided')
    }
  }, [handleInitialSetup, params.deviceId])

  const renderStepTitle = () => {
    switch (step) {
      case 'connecting':
        return 'Connecting to Ledger'
      case 'solana':
        return 'Solana Setup'
      case 'avalanche':
        return 'Avalanche Setup'
      case 'complete':
        return 'Setup Complete'
      default:
        return 'Confirm Addresses'
    }
  }

  const renderStepContent = () => {
    switch (step) {
      case 'connecting':
        return (
          <View
            sx={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <LoadingState />
            <Text
              variant="heading6"
              sx={{
                marginTop: 24,
                textAlign: 'center',
                color: '$textPrimary'
              }}>
              Connecting to your Ledger device...
            </Text>
            <Text
              variant="body2"
              sx={{
                marginTop: 8,
                textAlign: 'center',
                color: '$textSecondary'
              }}>
              Please ensure your device is unlocked and nearby
            </Text>
          </View>
        )

      case 'solana':
        return (
          <View sx={{ flex: 1, padding: 20 }}>
            <Card sx={{ marginBottom: 24 }}>
              <View sx={{ alignItems: 'center', padding: 20 }}>
                {isLoading ? (
                  <LoadingState />
                ) : solanaKeyState === 'error' ? (
                  <Icons.Action.Close
                    width={48}
                    height={48}
                    color={colors.$textDanger}
                  />
                ) : solanaKeyState === 'success' ? (
                  <Icons.Action.CheckCircleOutline
                    width={48}
                    height={48}
                    color={colors.$textSuccess}
                  />
                ) : (
                  <LoadingState />
                )}
                <Text
                  variant="heading6"
                  sx={{
                    marginTop: 16,
                    textAlign: 'center',
                    color: '$textPrimary'
                  }}>
                  {isLoading
                    ? 'Getting Solana Keys...'
                    : solanaKeyState === 'error'
                    ? 'Solana Keys Failed'
                    : solanaKeyState === 'success'
                    ? 'Solana Keys Retrieved'
                    : 'Waiting for Solana App...'}
                </Text>
                <Text
                  variant="body2"
                  sx={{
                    marginTop: 8,
                    textAlign: 'center',
                    color: '$textSecondary'
                  }}>
                  {isLoading
                    ? 'Please open the Solana app on your Ledger device'
                    : solanaKeyState === 'error'
                    ? 'Failed to retrieve Solana keys. Please try again.'
                    : solanaKeyState === 'success'
                    ? 'Successfully retrieved Solana public keys'
                    : 'Please open the Solana app on your Ledger device'}
                </Text>
              </View>
            </Card>
          </View>
        )

      case 'avalanche':
        return (
          <View sx={{ flex: 1, padding: 20 }}>
            <Card sx={{ marginBottom: 24 }}>
              <View sx={{ alignItems: 'center', padding: 20 }}>
                {isLoading ? (
                  <LoadingState />
                ) : avalancheKeyState === 'error' ? (
                  <Icons.Action.Close
                    width={48}
                    height={48}
                    color={colors.$textDanger}
                  />
                ) : avalancheKeyState === 'success' ? (
                  <Icons.Action.CheckCircleOutline
                    width={48}
                    height={48}
                    color={colors.$textSuccess}
                  />
                ) : (
                  <LoadingState />
                )}
                <Text
                  variant="heading6"
                  sx={{
                    marginTop: 16,
                    textAlign: 'center',
                    color: '$textPrimary'
                  }}>
                  {isLoading
                    ? 'Getting Avalanche Keys...'
                    : avalancheKeyState === 'error'
                    ? 'Avalanche Keys Failed'
                    : avalancheKeyState === 'success'
                    ? 'Avalanche Keys Retrieved'
                    : 'Waiting for Avalanche App...'}
                </Text>
                <Text
                  variant="body2"
                  sx={{
                    marginTop: 8,
                    textAlign: 'center',
                    color: '$textSecondary'
                  }}>
                  {isLoading
                    ? 'Please open the Avalanche app on your Ledger device'
                    : avalancheKeyState === 'error'
                    ? 'Failed to retrieve Avalanche keys. Please try again.'
                    : avalancheKeyState === 'success'
                    ? 'Successfully retrieved Avalanche public keys'
                    : 'Please open the Avalanche app on your Ledger device'}
                </Text>
              </View>
            </Card>
          </View>
        )

      case 'complete':
        return (
          <View sx={{ flex: 1, padding: 20 }}>
            <Card sx={{ marginBottom: 24 }}>
              <View sx={{ alignItems: 'center', padding: 20 }}>
                <Icons.Action.CheckCircleOutline
                  width={48}
                  height={48}
                  color={colors.$textSuccess}
                />
                <Text
                  variant="heading6"
                  sx={{
                    marginTop: 16,
                    textAlign: 'center',
                    color: '$textPrimary'
                  }}>
                  All Keys Retrieved Successfully
                </Text>
                <Text
                  variant="body2"
                  sx={{
                    marginTop: 8,
                    textAlign: 'center',
                    color: '$textSecondary'
                  }}>
                  Your Ledger wallet is ready to be created
                </Text>
              </View>
            </Card>

            <View sx={{ marginBottom: 24 }}>
              <Text
                variant="heading6"
                sx={{ marginBottom: 16, color: '$textPrimary' }}>
                Generated Addresses:
              </Text>

              {avalancheKeys && avalancheKeys.evm.key && (
                <View sx={{ marginBottom: 12 }}>
                  <Text
                    variant="subtitle2"
                    sx={{ color: '$textSecondary', marginBottom: 4 }}>
                    Avalanche (EVM):
                  </Text>
                  <Text
                    variant="body2"
                    sx={{
                      color: '$textPrimary',
                      fontFamily: 'DejaVuSansMono'
                    }}>
                    {avalancheKeys.evm.key}
                  </Text>
                </View>
              )}

              {xpAddress && (
                <View sx={{ marginBottom: 12 }}>
                  <Text
                    variant="subtitle2"
                    sx={{ color: '$textSecondary', marginBottom: 4 }}>
                    Avalanche (X/P):
                  </Text>
                  <Text
                    variant="body2"
                    sx={{
                      color: '$textPrimary',
                      fontFamily: 'DejaVuSansMono'
                    }}>
                    {xpAddress}
                  </Text>
                </View>
              )}

              {bitcoinAddress && (
                <View sx={{ marginBottom: 12 }}>
                  <Text
                    variant="subtitle2"
                    sx={{ color: '$textSecondary', marginBottom: 4 }}>
                    Bitcoin:
                  </Text>
                  <Text
                    variant="body2"
                    sx={{
                      color: '$textPrimary',
                      fontFamily: 'DejaVuSansMono'
                    }}>
                    {bitcoinAddress}
                  </Text>
                </View>
              )}

              {solanaKeys.length > 0 && (
                <View sx={{ marginBottom: 12 }}>
                  <Text
                    variant="subtitle2"
                    sx={{ color: '$textSecondary', marginBottom: 4 }}>
                    Solana:
                  </Text>
                  <Text
                    variant="body2"
                    sx={{
                      color: '$textPrimary',
                      fontFamily: 'DejaVuSansMono'
                    }}>
                    {solanaKeys[0].key.substring(0, 20)}...
                  </Text>
                </View>
              )}
            </View>

            <Button
              type="primary"
              size="large"
              onPress={handleCreateWallet}
              disabled={isLoading}>
              {isLoading ? 'Creating Wallet...' : 'Create Ledger Wallet'}
            </Button>
          </View>
        )

      default:
        return null
    }
  }

  return (
    <ScrollScreen isModal>
      <View sx={{ padding: 20, paddingBottom: 0 }}>
        <Text
          variant="heading4"
          sx={{ color: '$textPrimary', marginBottom: 8 }}>
          {renderStepTitle()}
        </Text>

        {step !== 'connecting' && (
          <View
            sx={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 20
            }}>
            <CircularProgress
              progress={
                step === 'solana' ? 0.33 : step === 'avalanche' ? 0.66 : 1
              }
              size={24}
              style={{ marginRight: 12 }}
            />
            <Text variant="body2" sx={{ color: '$textSecondary' }}>
              Step {step === 'solana' ? '1' : step === 'avalanche' ? '2' : '3'}{' '}
              of 3
            </Text>
          </View>
        )}
      </View>

      {renderStepContent()}
    </ScrollScreen>
  )
}
