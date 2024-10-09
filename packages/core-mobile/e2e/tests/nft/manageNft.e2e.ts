import actions from '../../helpers/actions'
import PortfolioPage from '../../pages/portfolio.page'
import { warmup } from '../../helpers/warmup'
import commonElsPage from '../../pages/commonEls.page'
import collectiblesPage from '../../pages/collectibles.page'

describe('Manage NFT', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should hide NFT via Manage List', async () => {
    await PortfolioPage.tapCollectiblesTab()
    await collectiblesPage.tapManageNft()
    await commonElsPage.typeSearchBar('7452')
    try {
      await actions.waitForElement(by.id('7452_blocked_nft'))
      await actions.tap(by.id('7452_blocked_nft'))
      console.log("Display NFT if it's already hidden")
    } catch (e) {
      console.log("It's already displayed on NFT list")
    }
    // hide the token and verify it's not visible on token list
    await actions.tap(by.id(`7452_displayed_nft`))
    await commonElsPage.goBack()
    await collectiblesPage.tapListSvg()
    await actions.waitForElementNotVisible(by.text('#7452 '))
  })

  it('should show NFT via Manage List', async () => {
    await PortfolioPage.tapManageTokens()
    await commonElsPage.typeSearchBar('7452')
    try {
      await actions.waitForElement(by.id('7452_displayed_nft'))
      await actions.tap(by.id('7452_displayed_nft'))
      console.log("Block NFT if it's already displayed")
    } catch (e) {
      console.log("It's already blocked")
    }
    // display the token that's hidden and verify it displays on token list
    await actions.tap(by.id(`7452_blocked_nft`))
    await commonElsPage.goBack()
    await collectiblesPage.tapListSvg()
    await actions.waitForElement(by.text('#7452 '))
  })
})
