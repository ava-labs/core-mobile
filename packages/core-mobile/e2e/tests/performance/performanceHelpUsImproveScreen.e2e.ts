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
    await Actions.waitForElementNoSync(AnalyticsConsentPage.noThanksBtn)
  })
})
