import {
  ActivityIndicator,
  Button,
  Icons,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import React from 'react'
import { Operation } from 'services/earn/computeDelegationSteps/types'
import { LedgerDevice } from 'services/ledger/types'
import { AnimatedIconWithText } from './AnimatedIconWithText'

export type LedgerReviewPhase = 'connecting' | 'progress'

type StepConfig = {
  title: string
  subtitle: string
}

export const getStepConfig = (operation: Operation | null): StepConfig => {
  switch (operation) {
    case Operation.EXPORT_C:
      return {
        title: 'Export from C-Chain',
        subtitle: 'Sign the export transaction on your Ledger device'
      }
    case Operation.IMPORT_P:
      return {
        title: 'Import to P-Chain',
        subtitle: 'Sign the import transaction on your Ledger device'
      }
    case Operation.DELEGATE:
      return {
        title: 'Delegate Stake',
        subtitle: 'Sign the delegation transaction on your Ledger device'
      }
    case Operation.EXPORT_P:
      return {
        title: 'Export from P-Chain',
        subtitle: 'Sign the export transaction on your Ledger device'
      }
    case Operation.IMPORT_C:
      return {
        title: 'Import to C-Chain',
        subtitle: 'Sign the import transaction on your Ledger device'
      }
    default:
      return {
        title: 'Preparing transaction...',
        subtitle: 'Please wait while we prepare your staking transaction'
      }
  }
}

type LedgerReviewFooterProps = {
  ledgerPhase: LedgerReviewPhase
  deviceForWallet?: LedgerDevice
  connectionStatus: string
  isLedgerConnected: boolean
  isReconnecting: boolean
  handleReconnect: () => void
  onCancel: () => void
  stepTitle: string
  stepSubtitle: string
  ledgerCurrentStep: number
  totalSteps: number
}

export const LedgerReviewFooter = ({
  ledgerPhase,
  deviceForWallet,
  connectionStatus,
  isLedgerConnected,
  isReconnecting,
  handleReconnect,
  onCancel,
  stepTitle,
  stepSubtitle,
  ledgerCurrentStep,
  totalSteps
}: LedgerReviewFooterProps): JSX.Element | null => {
  const { theme } = useTheme()

  if (ledgerPhase === 'connecting') {
    return (
      <View sx={{ gap: 16, marginTop: 24 }}>
        {deviceForWallet && (
          <View
            sx={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.colors.$surfaceSecondary,
              gap: 16,
              borderRadius: 12,
              paddingHorizontal: 16
            }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.colors.$surfaceSecondary,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
              <Icons.Custom.Bluetooth
                color={theme.colors.$textPrimary}
                width={24}
                height={24}
              />
            </View>
            <View
              sx={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12
              }}>
              <View sx={{ marginVertical: 14, flex: 1, flexShrink: 1 }}>
                <Text
                  numberOfLines={1}
                  variant="buttonMedium"
                  sx={{
                    fontFamily: 'Inter-Medium',
                    fontSize: 16,
                    color: '$textPrimary'
                  }}>
                  {deviceForWallet.name}
                </Text>
                <Text
                  numberOfLines={2}
                  variant="caption"
                  sx={{
                    fontSize: 13,
                    paddingTop: 4,
                    color: theme.colors.$textSecondary
                  }}>
                  {connectionStatus}
                </Text>
              </View>
              <View
                sx={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  flexShrink: 0
                }}>
                {!isLedgerConnected && (
                  <Button
                    type="secondary"
                    size="small"
                    style={{ width: 72 }}
                    onPress={handleReconnect}>
                    {isReconnecting ? (
                      <ActivityIndicator
                        size="small"
                        color={theme.colors.$surfacePrimary}
                      />
                    ) : (
                      'Connect'
                    )}
                  </Button>
                )}
              </View>
            </View>
          </View>
        )}
        <Button type="tertiary" size="large" onPress={onCancel}>
          Cancel
        </Button>
      </View>
    )
  }

  if (ledgerPhase === 'progress') {
    const title =
      stepTitle.includes('Preparing') || totalSteps <= 1
        ? stepTitle
        : `${stepTitle} [${ledgerCurrentStep}/${totalSteps}]`
    return (
      <View sx={{ gap: 16, marginTop: 24 }}>
        <AnimatedIconWithText
          icon={
            <Icons.Custom.Ledger
              color={theme.colors.$textPrimary}
              width={32}
              height={32}
            />
          }
          space={16}
          animationSize={{ width: 120, height: 120 }}
          title={title}
          titleStyle={{ fontSize: 16 }}
          subtitle={stepSubtitle}
          subtitleStyle={{ fontSize: 12 }}
          showAnimation
        />
        <Button type="tertiary" size="large" onPress={onCancel}>
          Cancel
        </Button>
      </View>
    )
  }

  return null
}
