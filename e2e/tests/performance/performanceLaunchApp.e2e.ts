/* eslint-disable jest/expect-expect */
import { device } from 'detox'
import WatchListPage from '../../pages/watchlist.page'
import Action from '../../helpers/actions'

it('Should display performance for Launch app', async () => {
  const startTime = new Date().getTime()
  await device.launchApp({ permissions: { camera: 'YES' } })
  await Action.waitForElementNoSync(WatchListPage.favoritesTab, 15000)
  const endTime = new Date().getTime()
  Action.saveTempUIPerformance(startTime, endTime)
})
