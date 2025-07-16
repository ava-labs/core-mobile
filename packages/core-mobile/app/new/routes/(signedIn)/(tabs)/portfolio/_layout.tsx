import { Stack } from 'common/components/Stack'
import { stackNavigatorScreenOptions } from 'common/consts/screenOptions'
import { useHomeScreenOptions } from 'common/hooks/useHomeScreenOptions'
import React, { useEffect } from 'react'
import PerformanceService, {
  PerformanceMilestone
} from 'services/performance/PerformanceService'

export default function PortfolioLayout(): JSX.Element {
  const homeScreenOptions = useHomeScreenOptions()

  useEffect(() => {
    PerformanceService.recordMilestone(
      PerformanceMilestone.PORTFOLIO_LOADING_STARTED
    )
  }, [])

  return (
    <Stack screenOptions={stackNavigatorScreenOptions}>
      <Stack.Screen name="index" options={homeScreenOptions} />
    </Stack>
  )
}
