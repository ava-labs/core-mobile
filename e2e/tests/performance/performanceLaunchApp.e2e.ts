/* eslint-disable jest/expect-expect */
import { device } from 'detox'
import WatchListPage from '../../pages/watchlist.page'
import Action from '../../helpers/actions'

const fs = require('fs')

it('Should display performance for Launch app', async () => {
  const startTime = new Date().getTime()
  await device.launchApp({ permissions: { camera: 'YES' } })
  await Action.waitForElementNoSync(WatchListPage.favoritesTab, 5000)
  const endTime = new Date().getTime()
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
