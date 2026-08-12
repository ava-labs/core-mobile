import { useNavigation, useRouter } from 'expo-router'
import { useCallback, useMemo } from 'react'
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
   * `true` while any of the setup queries (agent key, builder-fee approval,
   * unified account) is still resolving — `isTradingEnabled` is not yet
   * meaningful. Proactive UI (e.g. the details-screen "enable trading" CTA)
   * should not react to `isTradingEnabled === false` until this settles.
   */
  readonly isTradingStatusLoading: boolean
  /**
   * Call at the top of a submit handler. Returns `true` when one-time trading
   * setup is complete; otherwise presents the enable-trading form sheet and
   * returns `false` so the caller can bail out (the user re-submits once set
   * up).
   */
  readonly requireTradingEnabled: () => boolean
}

/**
 * Shared enable-trading gate for perps actions (place order, close, manage).
 * Mirrors core-web's flow: any action that signs an L1 order first ensures the
 * account is set up (agent + builder fee + unified account, matching the
 * three-step checklist) and, if not, presents the enable-trading form sheet
 * (`/perpetualsEnableTrading`) instead of submitting.
 */
export const usePerpsEnableTradingGate = (): PerpsEnableTradingGate => {
  const router = useRouter()
  const navigation = useNavigation()
  const { hasAgent, isLoadingAgent } = usePerps()
  const {
    isApproved: isBuilderFeeApproved,
    feeTenthsBps: builderFeeTenthsBps,
    isLoading: isBuilderFeeLoading
  } = usePerpsBuilderFee()
  const { isUnifiedAccount, isLoading: isUnifiedAccountLoading } =
    usePerpsUnifiedAccount()

  const isTradingStatusLoading =
    isLoadingAgent || isBuilderFeeLoading || isUnifiedAccountLoading

  const isTradingEnabled = useMemo(
    () =>
      hasAgent &&
      (builderFeeTenthsBps === undefined || isBuilderFeeApproved) &&
      isUnifiedAccount,
    [hasAgent, builderFeeTenthsBps, isBuilderFeeApproved, isUnifiedAccount]
  )

  const requireTradingEnabled = useCallback((): boolean => {
    if (!isTradingEnabled) {
      // Callers may await before gating (e.g. place-order's geo re-check). If
      // the user dismissed the calling screen during that await, don't present
      // the setup sheet over wherever they are now — just abort the submit.
      if (navigation.isFocused()) {
        router.navigate('/perpetualsEnableTrading')
      }
      return false
    }
    return true
  }, [isTradingEnabled, navigation, router])

  return { isTradingEnabled, isTradingStatusLoading, requireTradingEnabled }
}
