import React from 'react'
import { View, ActivityIndicator, TouchableOpacity } from 'react-native'
import { Text, useTheme } from '@avalabs/k2-alpine'
import { LedgerDerivationPathType } from 'services/wallet/LedgerWallet'
import { SetupProgress } from '../hooks/useLedgerWallet'

interface LedgerSetupProgressProps {
  progress: SetupProgress
  derivationPathType: LedgerDerivationPathType
  onCancel?: () => void
}

const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return remainingSeconds > 0
    ? `${minutes}m ${remainingSeconds}s`
    : `${minutes}m`
}

const getSetupInstructions = (
  derivationPathType: LedgerDerivationPathType
): string[] => {
  if (derivationPathType === LedgerDerivationPathType.BIP44) {
    return [
      'Please confirm each derivation path on your Ledger device',
      'This will take approximately 15 seconds',
      'Keep your device connected during setup'
    ]
  } else {
    return [
      'Please confirm each derivation path on your Ledger device',
      'This will take approximately 45 seconds',
      'Each account requires individual confirmation',
      'Keep your device connected during setup'
    ]
  }
}

export const LedgerSetupProgress: React.FC<LedgerSetupProgressProps> = ({
  progress,
  derivationPathType,
  onCancel
}) => {
  const {
    theme: { colors }
  } = useTheme()
  const instructions = getSetupInstructions(derivationPathType)

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      {/* Header */}
      <View style={{ alignItems: 'center', marginBottom: 48 }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.$surfaceSecondary,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24
          }}>
          <ActivityIndicator size="large" color={colors.$textPrimary} />
        </View>

        <Text
          variant="heading4"
          style={{ textAlign: 'center', marginBottom: 8 }}>
          Setting up your Ledger wallet
        </Text>

        <Text
          variant="body1"
          style={{
            textAlign: 'center',
            color: colors.$textSecondary,
            marginBottom: 16
          }}>
          {derivationPathType === LedgerDerivationPathType.BIP44
            ? 'BIP44 Setup'
            : 'Ledger Live Setup'}
        </Text>
      </View>

      {/* Progress section */}
      <View style={{ marginBottom: 32 }}>
        {/* Current step */}
        <Text
          variant="heading6"
          style={{ marginBottom: 16, textAlign: 'center' }}>
          {progress.currentStep}
        </Text>

        {/* Progress bar */}
        <View style={{ marginBottom: 16 }}>
          <View
            style={{
              height: 8,
              backgroundColor: colors.$surfaceSecondary,
              borderRadius: 4,
              overflow: 'hidden'
            }}>
            <View
              style={{
                height: '100%',
                width: `${progress.progress}%`,
                backgroundColor: colors.$textPrimary,
                borderRadius: 4
              }}
            />
          </View>
        </View>

        {/* Progress stats */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
          <Text variant="body2" style={{ color: colors.$textSecondary }}>
            Step {Math.ceil((progress.progress / 100) * progress.totalSteps)} of{' '}
            {progress.totalSteps}
          </Text>

          {progress.estimatedTimeRemaining !== undefined &&
            progress.estimatedTimeRemaining > 0 && (
              <Text variant="body2" style={{ color: colors.$textSecondary }}>
                ~{formatTime(progress.estimatedTimeRemaining)} remaining
              </Text>
            )}
        </View>
      </View>

      {/* Instructions */}
      <View
        style={{
          backgroundColor: colors.$surfaceSecondary,
          borderRadius: 12,
          padding: 20,
          marginBottom: 32
        }}>
        <Text variant="subtitle1" style={{ marginBottom: 12 }}>
          📱 Instructions
        </Text>
        {instructions.map((instruction, index) => (
          <Text
            key={index}
            variant="body2"
            style={{
              marginBottom: 8,
              color: colors.$textSecondary,
              lineHeight: 20
            }}>
            • {instruction}
          </Text>
        ))}
      </View>

      {/* Device status indicators */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 24
        }}>
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.$textSuccess,
            marginRight: 8
          }}
        />
        <Text variant="body2" style={{ color: colors.$textSecondary }}>
          Device connected
        </Text>
      </View>

      {/* Cancel button */}
      {onCancel && (
        <View style={{ alignItems: 'center' }}>
          <TouchableOpacity
            onPress={onCancel}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 24
            }}>
            <Text variant="body2" style={{ color: colors.$textSecondary }}>
              Cancel Setup
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}
