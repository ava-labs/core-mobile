/* eslint-disable jest/no-disabled-tests */
import portfolioPage from '../../../pages/portfolio.page'
import portfolio from '../../../locators/portfolio.loc'
import commonElsPage from '../../../pages/commonEls.page'
import warmup from '../../../helpers/warmup'
import { actions } from '../../../helpers/actions'
import { selectors } from '../../../helpers/selectors'

describe.skip('Portfolio tab', () => {
  it('Collectibles - hide unreachable collectibles on manage list', async () => {
    await warmup()
    await portfolioPage.tapCollectiblesTab()
    await commonElsPage.selectDropdown('view', 'List view')
    await commonElsPage.selectDropdown('view', 'Manage list')
    await portfolioPage.toggleCollectible(false, portfolio.unreachable)
    await portfolioPage.verifyUnreachableHidden()
  })

  it('Collectibles - search collectible on manage list', async () => {
    await commonElsPage.selectDropdown('view', 'Manage list')
    await commonElsPage.typeSearchBar(portfolio.managedNft)
    await actions.isVisible(selectors.getById(`nft_mange_list_item__0`))
    await actions.isNotVisible(selectors.getById(`nft_mange_list_item__1`))
  })

  it('Collectibles - hide collectible on manage list', async () => {
    await portfolioPage.verifyCollectibleHidden()
  })

  it('Collectibles - show collectible on manage list', async () => {
    await commonElsPage.selectDropdown('view', 'Manage list')
    await portfolioPage.verifyCollectibleShown()
  })
})
