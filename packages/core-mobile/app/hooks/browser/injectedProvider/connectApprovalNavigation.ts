import { router, type Href } from 'expo-router'
import { ConnectNavEffect } from './connectApprovalRegistry'

const authorizeRoute = (approvalId: string): Href =>
  // Cast through unknown: the dynamic route isn't in the generated typed-routes
  // union (Expo Router typegen), same as other parameterized routes in the app.
  ({
    pathname: '/authorizeInjectedDapp/[approvalId]',
    params: { approvalId }
  } as unknown as Href)

/**
 * Perform the navigation for a connect-approval {@link ConnectNavEffect}.
 *
 * Handles `open`/`replace`/`dismiss` (navigate / swap / pop the connect modal)
 * and returns `true`. Returns `false` only for `none` — the active modal is
 * unchanged (this request was queued, or there was no connect for this tab) —
 * so the caller can decide whether a non-connect modal needs handling. Keeping
 * the registry router-free and navigation here means the state machine stays
 * pure + unit-testable. (CP-14385)
 */
export const applyConnectNavEffect = (effect: ConnectNavEffect): boolean => {
  switch (effect.type) {
    case 'open':
      router.navigate(authorizeRoute(effect.approvalId))
      return true
    case 'replace':
      router.replace(authorizeRoute(effect.approvalId))
      return true
    case 'dismiss':
      // The active connect modal was this request's and is now gone → pop it.
      if (router.canGoBack()) router.back()
      return true
    case 'none':
      return false
  }
}
