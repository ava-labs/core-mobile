import assertions from '../../../helpers/assertions'
import { warmup } from '../../../helpers/warmup'
import commonElsLoc from '../../../locators/commonEls.loc'
import commonElsPage from '../../../pages/commonEls.page'
import portfolioPage from '../../../pages/portfolio.page'

describe('Assets Tab Filter', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should filter assets by network', async () => {
    await commonElsPage.selectDropdown('Filter', commonElsLoc.cChain)
    await portfolioPage.displayAssetsByNetwork(commonElsLoc.cChain_2)

    await commonElsPage.selectDropdown('Filter', commonElsLoc.ethereum)
    await portfolioPage.displayAssetsByNetwork(commonElsLoc.ethereum)

    await commonElsPage.selectDropdown('Filter', commonElsLoc.bitcoinNetwork)
    await portfolioPage.displayAssetsByNetwork(commonElsLoc.bitcoinNetwork)
    await assertions.isVisible(by.text(commonElsLoc.bitcoin))

    await commonElsPage.selectDropdown('Filter', commonElsLoc.allNetworks)
    await portfolioPage.displayAssetsByAllNetwork()
    // Bugs on the empty screen not having the `filter` button. Once it's fixed, it will be uncommented
    // await commonElsPage.selectDropdown('filter', commonElsLoc.pChain)
    // await portfolioPage.displayAssetsByNetwork(commonElsLoc.pChain_2)

    // await commonElsPage.selectDropdown('filter', commonElsLoc.xChain)
    // await portfolioPage.displayAssetsByNetwork(commonElsLoc.xChain_2)
  })
})
