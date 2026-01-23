import { createAction } from '@reduxjs/toolkit'
import { navigateWithPromise } from 'common/utils/navigateWithPromise'
import { waitForInteractions } from 'common/utils/waitForInteractions'
import AnalyticsService from 'services/analytics/AnalyticsService'
import {
  selectHasQualifiedForNestEgg,
  selectHasAcknowledgedNestEggQualification,
  setQualified
} from 'store/nestEgg'
import { selectIsNestEggEligible } from 'store/posthog'
import { AppListenerEffectAPI, AppStartListening } from 'store/types'
import { MINIMUM_SWAP_AMOUNT_USD } from './types'

// Action dispatched when a swap completes successfully
// This should be dispatched from SwapContext after a successful swap
export const swapCompleted = createAction<{
  txHash: string
  chainId: number
  fromTokenSymbol: string
  toTokenSymbol: string
  fromAmountUsd: number
  toAmountUsd: number
}>('nestEgg/swapCompleted')

/**
 * Handle swap completion for Nest Egg qualification
 * Checks if the user is eligible and the swap meets minimum requirements
 */
const handleSwapForNestEgg = async (
  action: ReturnType<typeof swapCompleted>,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { getState, dispatch } = listenerApi
  const state = getState()

  // Check eligibility
  const isEligible = selectIsNestEggEligible(state)
  if (!isEligible) {
    return
  }

  // Check if already qualified
  const hasQualified = selectHasQualifiedForNestEgg(state)
  if (hasQualified) {
    return
  }

  const { txHash, fromAmountUsd, chainId, fromTokenSymbol, toTokenSymbol } =
    action.payload

  // Check minimum swap amount ($10 USD)
  if (fromAmountUsd < MINIMUM_SWAP_AMOUNT_USD) {
    AnalyticsService.capture('NestEggSwapBelowMinimum', {
      fromAmountUsd,
      minimumRequired: MINIMUM_SWAP_AMOUNT_USD
    })
    return
  }

  // User qualifies!
  const timestamp = Date.now()
  dispatch(setQualified({ txHash, timestamp }))

  AnalyticsService.captureWithEncryption('NestEggQualified', {
    txHash,
    chainId,
    fromTokenSymbol,
    toTokenSymbol,
    fromAmountUsd,
    timestamp
  })

  // Show success modal
  await waitForInteractions()
  await navigateWithPromise({
    pathname: '/(signedIn)/(modals)/nestEggSuccess'
  })
}

/**
 * Check if we need to show the success modal on app launch
 * (e.g., if user qualified but app was closed before acknowledging)
 */
const checkPendingNestEggSuccess = async (
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { getState } = listenerApi
  const state = getState()

  const hasQualified = selectHasQualifiedForNestEgg(state)
  const hasAcknowledged = selectHasAcknowledgedNestEggQualification(state)

  // If user qualified but hasn't acknowledged, show success modal
  if (hasQualified && !hasAcknowledged) {
    await waitForInteractions()
    await navigateWithPromise({
      pathname: '/(signedIn)/(modals)/nestEggSuccess'
    })
  }
}

export const addNestEggListeners = (
  startListening: AppStartListening
): void => {
  // Listen for swap completions
  startListening({
    actionCreator: swapCompleted,
    effect: handleSwapForNestEgg
  })
}

export { checkPendingNestEggSuccess }
