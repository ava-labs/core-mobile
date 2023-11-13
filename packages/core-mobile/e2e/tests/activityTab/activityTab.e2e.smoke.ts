import Assert from '../../helpers/assertions'
import actions from '../../helpers/actions'
import ActivityTabPage from '../../pages/activityTab.page'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import TransactionDetailsPage from '../../pages/transactionDetails.page'
import PortfolioPage from '../../pages/portfolio.page'
import { warmup } from '../../helpers/warmup'

describe('Activity Tab', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('should show contract call only in activity list', async () => {
    await PortfolioPage.tapAvaxNetwork()
    await PortfolioPage.tapActivityTab()
    await actions.waitForElement(ActivityTabPage.arrowSVG, 10000, 1)
    await ActivityTabPage.tapFilterDropdown()
    await ActivityTabPage.tapContractCallFilterOption()
    await actions.waitForElement(ActivityTabPage.contractCallFilterOption)
    await Assert.isNotVisible(ActivityTabPage.bridgeSVG)
    // Need to make some contract call transactions on the mobile test account or these elements will not be present
    // await Assert.isVisible(ActivityTabPage.arrowSVG)
    // await Assert.isVisible(ActivityTabPage.linkSVG)
    await Assert.hasText(
      ActivityTabPage.selectFilterDropdown,
      'Display: Contract Call'
    )
  })

  it('should show bridge transactions only in list', async () => {
    await ActivityTabPage.tapFilterDropdown()
    await ActivityTabPage.tapBridgeFilterOption()
    await actions.waitForElement(ActivityTabPage.bridgeFilterOption)
    await Assert.isNotVisible(ActivityTabPage.arrowSVG, 1)
    await Assert.isVisible(ActivityTabPage.selectFilterDropdown)
    // Todo: need to figure out why this locator is not working in the app
    // await Assert.isVisible(ActivityTabPage.linkSVG)
    await Assert.hasText(
      ActivityTabPage.selectFilterDropdown,
      'Display: Bridge'
    )
  })

  it('should display incoming transaction details', async () => {
    await ActivityTabPage.tapFilterDropdown()
    await ActivityTabPage.tapIncomingFilterOption()
    await actions.waitForElement(ActivityTabPage.incomingFilterOption)
    await Assert.hasText(
      ActivityTabPage.selectFilterDropdown,
      'Display: Incoming'
    )
  })

  it('should display outgoing transaction details', async () => {
    await ActivityTabPage.tapFilterDropdown()
    await ActivityTabPage.tapOutgingFilterOption()
    await actions.waitForElement(ActivityTabPage.outgoingFilterOption)
    await Assert.hasText(
      ActivityTabPage.selectFilterDropdown,
      'Display: Outgoing'
    )

    if ((await actions.isVisible(ActivityTabPage.linkSVG, 0)) === false) {
      await ActivityTabPage.tapArrowIcon(0)
      await Assert.isVisible(TransactionDetailsPage.status)
      await Assert.isVisible(TransactionDetailsPage.transactionType)
    }
  })
})
