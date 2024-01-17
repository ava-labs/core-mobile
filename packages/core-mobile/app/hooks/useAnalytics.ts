import { useDispatch } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { setCoreAnalytics } from 'store/settings/securityPrivacy'

export function useAnalyticsConsent(): {
  accept: () => void
  reject: () => void
} {
  const dispatch = useDispatch()

  const accept = (): void => {
    AnalyticsService.capture('OnboardingAnalyticsAccepted')
    dispatch(setCoreAnalytics(true))
  }

  const reject = (): void => {
    AnalyticsService.capture('OnboardingAnalyticsRejected')
    dispatch(setCoreAnalytics(false))
  }

  return {
    accept,
    reject
  }
}
