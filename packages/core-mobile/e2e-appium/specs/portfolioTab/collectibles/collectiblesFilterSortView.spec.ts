import warmup from '../../../helpers/warmup'
import commonElsLoc from '../../../locators/commonEls.loc'
import commonElsPage from '../../../pages/commonEls.page'
import portfolioPage from '../../../pages/portfolio.page'

describe('Portfolio tab', () => {
  it('Collectibles - view collectibles by grid and list', async () => {
    await warmup()
    await portfolioPage.tapCollectiblesTab()
    // grid view
    await portfolioPage.verifyCollectibleRow()
    // list view
    await commonElsPage.selectDropdown('view', 'List view')
    await portfolioPage.verifyCollectibleRow(true)
  })

  it('Collectibles - sort collectibles by name', async () => {
    // Ascending order
    await portfolioPage.verifyCollectiblesSort()

    // Descending order
    await commonElsPage.selectDropdown('sort', 'Name Z to A')
    await portfolioPage.verifyCollectiblesSort(false)
  })

  it('Collectibles - filter collectibles by network', async () => {
    // all networks
    await portfolioPage.verifyCollectiblesByNetwork()

    // C-Chain
    await commonElsPage.filter(commonElsLoc.cChain)
    await portfolioPage.verifyCollectiblesByNetwork(commonElsLoc.cChainId)

    // Ethereum
    await commonElsPage.filter(commonElsLoc.ethereum)
    await portfolioPage.verifyCollectiblesByNetwork(commonElsLoc.ethChainId)
  })
})
