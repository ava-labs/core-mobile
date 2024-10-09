import { warmup } from '../../helpers/warmup'
import bottomTabsPage from '../../pages/bottomTabs.page'
import portfolioLoc from '../../locators/portfolio.loc'
import plusMenuPage from '../../pages/plusMenu.page'
import networksManagePage from '../../pages/networksManage.page'

describe('Dynamic Plus Icon by Network', () => {
  beforeAll(async () => {
    await warmup()
  })

  const networks: string[] = [
    portfolioLoc.avaxNetwork,
    portfolioLoc.avaxPNetwork,
    portfolioLoc.avaxXNetwork,
    portfolioLoc.btcNetwork,
    portfolioLoc.ethNetwork
  ]
  it('should show dynamic plus icon items by network', async () => {
    for (const network of networks) {
      // Check PlusIcon Options by network
      await networksManagePage.switchNetwork(network)
      await bottomTabsPage.tapPlusIcon()
      // Verify SWAP and BUY are NOT available on all networks except C-Chain
      await plusMenuPage.verifyPlusIconOptions(network)
      await bottomTabsPage.tapPlusIcon()
    }
  })
})
