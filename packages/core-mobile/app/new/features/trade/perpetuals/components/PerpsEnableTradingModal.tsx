import {
  Button,
  Checklist,
  type ChecklistItem,
  Text,
  View
} from '@avalabs/k2-alpine'
import { isPerpsUserRejection } from '@avalabs/perps-sdk'
import { showSnackbar } from 'common/utils/toast'
import React, { useCallback, useEffect } from 'react'
import { Modal, Pressable } from 'react-native'
import { usePerps } from '../contexts/PerpsProvider'
import { usePerpsBuilderFee } from '../hooks/usePerpsBuilderFee'
import { usePerpsUnifiedAccount } from '../hooks/usePerpsUnifiedAccount'

export type PerpsEnableTradingModalProps = {
  readonly open: boolean
  readonly onClose: () => void
  /** Fired once all required setup steps complete in this session. */
  readonly onAllStepsCompleted?: () => void
}

/**
 * "Set up trading account" sheet: agent approval, builder-fee approval, and
 * unified-account enablement. All three steps are required before trading
 * (matches core-web's `PerpsEnableTradingModal`).
 */
export const PerpsEnableTradingModal = ({
  open,
  onClose,
  onAllStepsCompleted
}: PerpsEnableTradingModalProps): JSX.Element | null => {
  const { hasAgent, approveBackgroundTrading, isAgentApprovalSubmitting } =
    usePerps()
  const {
    feeTenthsBps: builderFeeTenthsBps,
    isApproved: isBuilderFeeApproved,
    isApproving: isBuilderFeeApproving,
    approve: approveBuilderFee
  } = usePerpsBuilderFee()
  const {
    isUnifiedAccount,
    isEnabling: isUnifiedAccountEnabling,
    enableUnifiedAccount
  } = usePerpsUnifiedAccount()

  const isBuilderFeeStepDone =
    builderFeeTenthsBps === undefined || isBuilderFeeApproved

  const handleEnableAgent = useCallback(async () => {
    try {
      await approveBackgroundTrading()
    } catch (e) {
      if (isPerpsUserRejection(e)) {
        showSnackbar('User rejected the request.')
      } else if (e instanceof Error && e.message.length > 0) {
        showSnackbar(e.message)
      } else {
        showSnackbar('Failed to enable background trading.')
      }
    }
  }, [approveBackgroundTrading])

  const handleEnableBuilderFee = useCallback(async () => {
    try {
      await approveBuilderFee()
      if (isUnifiedAccount) {
        onAllStepsCompleted?.()
      }
    } catch {
      // `usePerpsBuilderFee.approve` already toasts rejection and failures.
    }
  }, [approveBuilderFee, isUnifiedAccount, onAllStepsCompleted])

  const handleEnableUnifiedAccount = useCallback(async () => {
    try {
      await enableUnifiedAccount()
      onAllStepsCompleted?.()
      onClose()
    } catch {
      // `usePerpsUnifiedAccount.enableUnifiedAccount` already toasts failures.
    }
  }, [enableUnifiedAccount, onAllStepsCompleted, onClose])

  // Close when all steps are already satisfied (e.g. reopen after prior setup).
  useEffect(() => {
    if (!open) {
      return
    }
    if (hasAgent && isBuilderFeeStepDone && isUnifiedAccount) {
      onAllStepsCompleted?.()
      onClose()
    }
  }, [
    open,
    hasAgent,
    isBuilderFeeStepDone,
    isUnifiedAccount,
    onAllStepsCompleted,
    onClose
  ])

  const steps: ChecklistItem[] = [
    {
      title: 'Enable background transactions',
      description: 'Allows faster trade placement with fewer clicks',
      done: hasAgent,
      actionLabel: isAgentApprovalSubmitting ? 'Waiting…' : 'Enable',
      onAction: () => void handleEnableAgent(),
      actionDisabled: isAgentApprovalSubmitting,
      loading: isAgentApprovalSubmitting,
      actionTestId: 'perps-enable-agent-button'
    },
    {
      title: 'Enable trading on Hyperliquid',
      description: 'Allows your Core wallet to trade on Hyperliquid',
      done: isBuilderFeeStepDone,
      actionLabel: isBuilderFeeApproving ? 'Waiting…' : 'Enable',
      onAction: () => void handleEnableBuilderFee(),
      actionDisabled: !hasAgent || isBuilderFeeApproving,
      loading: isBuilderFeeApproving,
      actionTestId: 'perps-enable-hyperliquid-button'
    },
    {
      title: 'Enable unified account',
      description:
        'Pools spot and perps into one balance for trading on Hyperliquid.',
      done: isUnifiedAccount,
      actionLabel: isUnifiedAccountEnabling ? 'Waiting…' : 'Enable',
      onAction: () => void handleEnableUnifiedAccount(),
      actionDisabled:
        !hasAgent || !isBuilderFeeStepDone || isUnifiedAccountEnabling,
      loading: isUnifiedAccountEnabling,
      actionTestId: 'perps-enable-unified-account-button'
    }
  ]

  if (!open) {
    return null
  }

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0,0,0,0.5)'
        }}>
        <Pressable
          // Swallow taps on the sheet so they don't dismiss via the backdrop.
          onPress={event => event.stopPropagation()}
          style={{ width: '100%' }}>
          <View
            testID="perps-enable-trading-modal"
            sx={{
              backgroundColor: '$surfacePrimary',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              gap: 24
            }}>
            <View sx={{ gap: 8 }}>
              <Text variant="heading3">Set up trading account</Text>
              <Text variant="body1" sx={{ color: '$textSecondary' }}>
                Complete these one-time steps to get started trading on
                Hyperliquid
              </Text>
            </View>

            <Checklist items={steps} />

            <Button
              type="tertiary"
              size="large"
              onPress={onClose}
              testID="perps-enable-trading-close">
              Not now
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
