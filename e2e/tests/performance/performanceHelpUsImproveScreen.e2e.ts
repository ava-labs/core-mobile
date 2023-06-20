/* eslint-disable jest/expect-expect */
/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */

import Actions from '../../helpers/actions'
import AnalyticsConsentPage from '../../pages/analyticsConsent.page'
import WatchListPage from '../../pages/watchlist.page'
import { warmup } from '../../helpers/warmup'

describe('Performance Help Us improve Screen', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should view proper page title and action icons', async () => {
    await WatchListPage.tapNewWalletBtn()
    const startTime = new Date().getTime()
    await Actions.waitForElementNoSync(AnalyticsConsentPage.noThanksBtn)
    const endTime = new Date().getTime()
    await Actions.reportUIPerformance(
      startTime,
      endTime,
      'performanceHelpUsImproveScreen',
      1,
      3
    )
  })
})
