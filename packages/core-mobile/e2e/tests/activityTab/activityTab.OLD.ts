import activityTab from '../../locators/activityTab.loc'
import { warmup } from '../../helpers/warmup'
import cl from '../../locators/commonEls.loc'
import bottomTabsPage from '../../pages/bottomTabs.page'
import cp from '../../pages/commonEls.page'
import activityTabPage from '../../pages/activityTab.page'

describe('Activity Tab', () => {
  beforeAll(async () => {
    await warmup()
  })

  const filters = ['All', 'Sent', 'Received', 'Swap', 'Bridge']
  const networks = [cl.cChain, cl.pChain, cl.bitcoin, cl.ethereum, cl.solana]

  beforeEach(async () => {
    await bottomTabsPage.tapActivityTab()
    await cp.filter(activityTab.allFilter)
  })

  filters.forEach(filterItem => {
    it(`should filter ${filterItem} on Activity`, async () => {
      await cp.filter(filterItem)
      await activityTabPage.verifyFilteredItem(filterItem, cl.cChain)
    })
  })

  networks.forEach(network => {
    it(`should filter ${network} on Activity`, async () => {
      await cp.filter(network, cp.networkFilterDropdown)
      await activityTabPage.verifyFilteredItem('All', network)
    })
  })
})
