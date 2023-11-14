import { device } from 'detox'
import WatchListPage from '../../pages/watchlist.page'
import Action from '../../helpers/actions'

it('Should display performance for Launch app', async () => {
  await device.launchApp({ permissions: { camera: 'YES' } })
  await Action.waitForElementNoSync(WatchListPage.favoritesTab, 15000)
})
