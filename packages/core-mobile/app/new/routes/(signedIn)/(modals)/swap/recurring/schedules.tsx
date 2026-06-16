import { useRouter } from 'expo-router'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectIsRecurringSwapsBlocked } from 'store/posthog'
import { RecurringSchedulesScreen } from 'features/recurringSwap/screens/RecurringSchedulesScreen'

// Route-level kill-switch guard. The Activity-tab banner and the swap-modal
// row already self-hide when `selectIsRecurringSwapsBlocked` is true, so a
// user can't reach this route through the UI when the flag is off. But the
// route is still a real path in the modal stack — anything that can drive
// expo-router by URL (deep link, in-app navigation from old / cached state,
// dev menu) could land here, render the management screen, and let a user
// initiate cancel/pause/unpause TXs the feature flag was supposed to gate.
//
// Pop back to wherever the user came from when blocked. If there's no
// back history (deep-link landing), fall back to dismissing the swap modal
// stack entirely — matches `SwapScreen.dismissOrGoBack`.
const RecurringSchedulesRoute = (): JSX.Element | null => {
  const router = useRouter()
  const isBlocked = useSelector(selectIsRecurringSwapsBlocked)

  useEffect(() => {
    if (!isBlocked) return
    if (router.canGoBack()) {
      router.back()
    } else {
      router.dismissAll()
    }
  }, [isBlocked, router])

  // Render nothing while blocked — the effect above queues the navigation,
  // but returning the screen here would briefly mount + run its
  // `useRecurringSchedules` query before the navigation lands.
  if (isBlocked) return null

  return <RecurringSchedulesScreen />
}

export default RecurringSchedulesRoute
