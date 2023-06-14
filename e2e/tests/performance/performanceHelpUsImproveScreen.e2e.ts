/* eslint-disable jest/expect-expect */
/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */

import Actions from '../../helpers/actions'
import AnalyticsConsentPage from '../../pages/analyticsConsent.page'
import WatchListPage from '../../pages/watchlist.page'
import { warmup } from '../../helpers/warmup'

const fs = require('fs')

describe('Performance Help Us improve Screen', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should view proper page title and action icons', async () => {
    await WatchListPage.tapNewWalletBtn()
    const startTime = new Date().getTime()
    await Actions.waitForElementNoSync(AnalyticsConsentPage.noThanksBtn)
    const endTime = await new Date().getTime()
    const result = ((endTime - startTime) / 1000).toString()
    fs.writeFile(
      './e2e/tests/performance/testResults/tempResults.txt',
      result,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err: any) => {
        if (err) throw err
      }
    )
  })
})
