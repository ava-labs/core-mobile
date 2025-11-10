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
    await portfolioPage.verifyCollectiblesByNetwork()

    await commonElsPage.filter(commonElsLoc.cChain)
    console.log('Filtered by C-Chain')
    await portfolioPage.verifyCollectiblesByNetwork(commonElsLoc.cChainId)
    console.log('Verified C-Chain')
    await commonElsPage.filter(commonElsLoc.ethereum)
    console.log('Filtered by Ethereum')
    await portfolioPage.verifyCollectiblesByNetwork(commonElsLoc.ethChainId)
    console.log('Verified Ethereum')
  })
})
