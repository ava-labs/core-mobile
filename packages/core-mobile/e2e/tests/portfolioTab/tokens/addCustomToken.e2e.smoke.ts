import Actions from '../../../helpers/actions'
import PortfolioPage from '../../../pages/portfolio.page'
import ManageTokensPage from '../../../pages/manageTokens.page'
import { warmup } from '../../../helpers/warmup'
import manageTokensLoc from '../../../locators/manageTokens.loc'

describe('Add custom token', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should add custom token on C-Chain', async () => {
    await PortfolioPage.tapAvaxNetwork()
    await Actions.waitForElement(PortfolioPage.manageTokens)
    await PortfolioPage.tapManageTokens()
    await Actions.waitForElement(ManageTokensPage.addcustomToken)
    await ManageTokensPage.tapAddcustomToken()
    await Actions.waitForElement(ManageTokensPage.inputContractAddress)
    await ManageTokensPage.inputCustomToken(
      manageTokensLoc.customCChainTokenContract
    )
    await Actions.waitForElement(ManageTokensPage.customCChainTokenName)
    await ManageTokensPage.tapAddButton()
    try {
      await Actions.waitForElement(ManageTokensPage.added)
    } catch (e) {
      console.log("Android can't find a snackbar element")
    }
    await Actions.waitForElementNotVisible(
      ManageTokensPage.inputContractAddress
    )
    await Actions.waitForElement(ManageTokensPage.added)
    await Actions.waitForElement(ManageTokensPage.addcustomToken)
  })
})
