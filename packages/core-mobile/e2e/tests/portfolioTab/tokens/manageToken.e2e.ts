import actions from '../../../helpers/actions'
import PortfolioPage from '../../../pages/portfolio.page'
import { warmup } from '../../../helpers/warmup'
import commonElsPage from '../../../pages/commonEls.page'
import manageTokensPage from '../../../pages/manageTokens.page'

describe('Manage Token', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should not allow to manage AVAX via manage token', async () => {
    // Search for AVAX on Manage Token Screen
    await PortfolioPage.tapActiveNetwork()
    await PortfolioPage.tapManageTokens()
    await commonElsPage.typeSearchBar('AVAX')
    // Verify AVAX is NOT available on Manage Token Screen
    await actions.waitForElementNotVisible(by.id('Avalanche_displayed'))
    await actions.waitForElementNotVisible(by.id('Avalanche_blocked'))
  })

  it('should hide token via manage token', async () => {
    // Hide Tether Token
    await manageTokensPage.showToken('KET', false)
    // Verify the token is hidden
    await actions.waitForElementNotVisible(by.text('KET'))
  })

  it('should show token via manage token', async () => {
    // Show Tether Token
    await PortfolioPage.tapManageTokens()
    await manageTokensPage.showToken('KET')
    // Verify the token is shown
    await actions.scrollListUntil(
      by.id(`portfolio_list_item_title__KET`),
      by.id('portfolio_token_list'),
      20
    )
    await actions.waitForElement(by.id(`portfolio_list_item_title__KET`))
  })
})
