import React, { useCallback, useMemo, useState } from 'react'
import { PerpsEnableTradingModal } from '../components/PerpsEnableTradingModal'
import { usePerps } from '../contexts/PerpsProvider'
import { usePerpsBuilderFee } from './usePerpsBuilderFee'
import { usePerpsUnifiedAccount } from './usePerpsUnifiedAccount'

export type PerpsEnableTradingGate = {
  /**
   * One-time perps setup (agent + builder fee + unified account) is complete so
   * HL orders can be signed. `builderFeeTenthsBps === undefined` means Markr has
   * not resolved yet — do not treat that as "not approved" on cold load.
   */
  readonly isTradingEnabled: boolean
  /**
   * Call at the top of a submit handler. Returns `true` when one-time trading
   * setup is complete; otherwise opens the enable-trading sheet and returns
   * `false` so the caller can bail out (the user re-submits once set up).
   */
  readonly requireTradingEnabled: () => boolean
  /** Render this in the screen tree so the enable-trading sheet can appear. */
  readonly enableTradingModal: React.ReactNode
}

/**
 * Shared enable-trading gate for perps actions (place order, close, manage).
 * Mirrors core-web's flow: any action that signs an L1 order first ensures the
 * account is set up (agent + builder fee + unified account, matching the
 * three-step checklist) and, if not, surfaces {@link PerpsEnableTradingModal}
 * instead of submitting.
 */
export const usePerpsEnableTradingGate = (): PerpsEnableTradingGate => {
  const { hasAgent } = usePerps()
  const {
    isApproved: isBuilderFeeApproved,
    feeTenthsBps: builderFeeTenthsBps
  } = usePerpsBuilderFee()
  const { isUnifiedAccount } = usePerpsUnifiedAccount()
  const [visible, setVisible] = useState(false)

  const isTradingEnabled = useMemo(
    () =>
      hasAgent &&
      (builderFeeTenthsBps === undefined || isBuilderFeeApproved) &&
      isUnifiedAccount,
    [hasAgent, builderFeeTenthsBps, isBuilderFeeApproved, isUnifiedAccount]
  )

  const requireTradingEnabled = useCallback((): boolean => {
    if (!isTradingEnabled) {
      setVisible(true)
      return false
    }
    return true
  }, [isTradingEnabled])

  const enableTradingModal = (
    <PerpsEnableTradingModal open={visible} onClose={() => setVisible(false)} />
  )

  return { isTradingEnabled, requireTradingEnabled, enableTradingModal }
}
