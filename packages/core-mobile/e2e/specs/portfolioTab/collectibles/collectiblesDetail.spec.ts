/* eslint-disable jest/no-disabled-tests */
import portfolioPage from '../../../pages/portfolio.page'
import commonElsPage from '../../../pages/commonEls.page'
import warmup from '../../../helpers/warmup'
import commonElsLoc from '../../../locators/commonEls.loc'
import { actions } from '../../../helpers/actions'

describe.skip('Portfolio tab', () => {
  it('Collectibles - C-Chain collectible detail', async () => {
    await warmup()
    await portfolioPage.tapCollectiblesTab()
    await commonElsPage.selectDropdown('view', 'List view')
    await commonElsPage.filter(commonElsLoc.cChain)
    await portfolioPage.verifyCollectibleDetail()
    await commonElsPage.goBack()
  })

  it('Collectibles - Ethereum collectible detail', async () => {
    await commonElsPage.filter(commonElsLoc.ethereum)
    await portfolioPage.verifyCollectibleDetail(false)
  })

  it('Collectibles - Hide all collectibles', async () => {
    while (await actions.getVisible(portfolioPage.hideBtn)) {
      await portfolioPage.tapHide()
    }
    await portfolioPage.verifyNftEmptyScreen()
    await portfolioPage.tapResetFilterBtn()
    await portfolioPage.verifyNftEmptyScreen(false)
  })
})
