import actions from '../../../helpers/actions'
import PortfolioPage from '../../../pages/portfolio.page'
import { warmup } from '../../../helpers/warmup'
import commonElsPage from '../../../pages/commonEls.page'
import collectiblesPage from '../../../pages/collectibles.page'

describe('Manage NFT', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should hide NFT via Manage List', async () => {
    await PortfolioPage.tapCollectiblesTab()
    await collectiblesPage.tapManageNft()
    await commonElsPage.typeSearchBar('7452')
    // TryCatch Phrase is for test requirment
    try {
      await actions.waitForElement(by.id('7452_blocked_nft'))
      await actions.tap(by.id('7452_blocked_nft'))
      console.log("Display NFT if it's already hidden")
    } catch (e) {
      console.log("It's already displayed on NFT list")
    }
    // Hide NFT
    await actions.tap(by.id(`7452_displayed_nft`))
    await commonElsPage.goBack()
    // Verify NFT is NOT availble
    await collectiblesPage.tapListSvg()
    await actions.waitForElementNotVisible(by.text('#7452 '))
  })

  it('should show NFT via Manage List', async () => {
    await PortfolioPage.tapManageTokens()
    await commonElsPage.typeSearchBar('7452')
    // TryCatch Phrase is for test requirment
    try {
      await actions.waitForElement(by.id('7452_displayed_nft'))
      await actions.tap(by.id('7452_displayed_nft'))
      console.log("Block NFT if it's already displayed")
    } catch (e) {
      console.log("It's already blocked")
    }
    // Display NFT
    await actions.tap(by.id(`7452_blocked_nft`))
    await commonElsPage.goBack()
    // Verify NFT is available
    await collectiblesPage.tapListSvg()
    await actions.waitForElement(by.text('#7452 '))
  })
})
