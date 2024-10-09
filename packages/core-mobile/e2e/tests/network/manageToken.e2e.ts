import actions from '../../helpers/actions'
import PortfolioPage from '../../pages/portfolio.page'
import { warmup } from '../../helpers/warmup'
import commonElsPage from '../../pages/commonEls.page'

describe('Manage Token', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should not allow AVAX to hide via manage token', async () => {
    await PortfolioPage.tapActiveAvaxNetwork()
    await PortfolioPage.tapManageTokens()
    await commonElsPage.typeSearchBar('AVAX')
    await actions.waitForElementNotVisible(by.id('Avalanche_displayed'))
    await actions.waitForElementNotVisible(by.id('Avalanche_blocked'))
  })

  it('should hide token via manage token', async () => {
    await commonElsPage.typeSearchBar('TetherToken')
    try {
      await actions.waitForElement(by.id('TetherToken_blocked'))
      await actions.tap(by.id('TetherToken_blocked'))
      console.log("Display the token if it's already hidden")
    } catch (e) {
      console.log("It's already displayed on token list")
    }
    // hide the token and verify it's not visible on token list
    await actions.tap(by.id(`TetherToken_displayed`))
    await commonElsPage.goBack()
    await actions.waitForElementNotVisible(by.text('TetherToken'))
  })

  it('should show token via manage token', async () => {
    await PortfolioPage.tapManageTokens()
    await commonElsPage.typeSearchBar('TetherToken')
    try {
      await actions.waitForElement(by.id('TetherToken_display'))
      await actions.tap(by.id('TetherToken_blocked'))
      console.log("Block the token if it's already displayed")
    } catch (e) {
      console.log("It's already blocked")
    }
    // display the token that's hidden and verify it displays on token list
    await actions.tap(by.id(`TetherToken_blocked`))
    await commonElsPage.goBack()
    await actions.waitForElement(by.text('TetherToken'))
  })
})
