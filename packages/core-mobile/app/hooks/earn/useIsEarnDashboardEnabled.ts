import { useEffect, useState } from 'react'
import { useStakes } from './useStakes'

// a hook to determine whether the Earn Dashboard should be displayed
// when there are stakes (either active or completed), we display the Dashboard
// when there are no stakes, we direct users to Stake Setup flow
export const useIsEarnDashboardEnabled = () => {
  const { data: stakes } = useStakes()
  const [isEarnDashboardEnabled, setIsEarnDashboardEnabled] = useState(true)

  useEffect(() => {
    if (!stakes) return

    const hasStakes = stakes.length > 0
    setIsEarnDashboardEnabled(hasStakes ? true : false)
  }, [stakes])

  return { isEarnDashboardEnabled }
}
