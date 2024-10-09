import actions from '../../helpers/actions'
import PortfolioPage from '../../pages/portfolio.page'
import { warmup } from '../../helpers/warmup'
import commonElsPage from '../../pages/commonEls.page'

describe('Manage Token', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should not allow to manage AVAX via manage token', async () => {
    // Search for AVAX on Manage Token Screen
    await PortfolioPage.tapActiveAvaxNetwork()
    await PortfolioPage.tapManageTokens()
    await commonElsPage.typeSearchBar('AVAX')
    // Verify AVAX is NOT available on Manage Token Screen
    await actions.waitForElementNotVisible(by.id('Avalanche_displayed'))
    await actions.waitForElementNotVisible(by.id('Avalanche_blocked'))
  })

  it('should hide token via manage token', async () => {
    await commonElsPage.typeSearchBar('TetherToken')
    // TryCatch Phrase is for test requirment
    try {
      await actions.waitForElement(by.id('TetherToken_blocked'))
      await actions.tap(by.id('TetherToken_blocked'))
      console.log("Display the token if it's already hidden")
    } catch (e) {
      console.log("It's already displayed on token list")
    }
    // Hide the token
    await actions.tap(by.id(`TetherToken_displayed`))
    await commonElsPage.goBack()
    // Verify the token is NOT available
    await actions.waitForElementNotVisible(by.text('TetherToken'))
  })

  it('should show token via manage token', async () => {
    await PortfolioPage.tapManageTokens()
    await commonElsPage.typeSearchBar('TetherToken')
    // TryCatch Phrase is for test requirment
    try {
      await actions.waitForElement(by.id('TetherToken_display'))
      await actions.tap(by.id('TetherToken_blocked'))
      console.log("Block the token if it's already displayed")
    } catch (e) {
      console.log("It's already blocked")
    }
    // Display the token
    await actions.tap(by.id(`TetherToken_blocked`))
    await commonElsPage.goBack()
    // Verify the token is available
    await actions.waitForElement(by.text('TetherToken'))
  })
})
