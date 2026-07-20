import { Checklist, View, type ChecklistItem } from '@avalabs/k2-alpine'
import { isPerpsUserRejection } from '@avalabs/perps-sdk'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { showSnackbar } from 'common/utils/toast'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useRef } from 'react'
import { usePerps } from '../contexts/PerpsProvider'
import { usePerpsBuilderFee } from '../hooks/usePerpsBuilderFee'
import { usePerpsUnifiedAccount } from '../hooks/usePerpsUnifiedAccount'

/**
 * "Set up trading account" form sheet: agent approval, builder-fee approval,
 * and unified-account enablement. All three steps are required before trading
 * (matches core-web's `PerpsEnableTradingModal`). Presented as a modal route
 * on top of the perps screen that required trading setup.
 */
export const PerpetualsEnableTradingScreen = (): JSX.Element => {
  const router = useRouter()
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

  // The last step's handler dismisses eagerly while the effect below also
  // reacts to the queries flipping done — guard so we only pop this sheet once.
  const dismissedRef = useRef(false)
  const dismiss = useCallback(() => {
    if (dismissedRef.current) {
      return
    }
    dismissedRef.current = true
    router.canGoBack() && router.back()
  }, [router])

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
    } catch {
      // `usePerpsBuilderFee.approve` already toasts rejection and failures.
    }
  }, [approveBuilderFee])

  const handleEnableUnifiedAccount = useCallback(async () => {
    try {
      await enableUnifiedAccount()
      dismiss()
    } catch {
      // `usePerpsUnifiedAccount.enableUnifiedAccount` already toasts failures.
    }
  }, [enableUnifiedAccount, dismiss])

  // Dismiss when all steps are already satisfied (e.g. reopen after prior setup).
  useEffect(() => {
    if (hasAgent && isBuilderFeeStepDone && isUnifiedAccount) {
      dismiss()
    }
  }, [hasAgent, isBuilderFeeStepDone, isUnifiedAccount, dismiss])

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

  return (
    <ScrollScreen
      isModal
      title="Set up trading account"
      subtitle="Complete these one-time steps to get started trading on Hyperliquid"
      contentContainerStyle={{ padding: 16 }}>
      <View style={{ marginTop: 24 }}>
        <Checklist items={steps} />
      </View>
    </ScrollScreen>
  )
}
