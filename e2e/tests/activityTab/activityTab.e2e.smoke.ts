/* eslint-disable jest/expect-expect */
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
    await PortfolioPage.tapActivityTab()
    const startTime = new Date().getTime()
    await actions.waitForElement(ActivityTabPage.arrowSVG, 10000, 0)
    const endTime = new Date().getTime()
    await actions.reportUIPerformance(
      startTime,
      endTime,
      'performanceActivityPageScreen',
      1,
      3
    )
    await ActivityTabPage.tapFilterDropdown()
    await ActivityTabPage.tapContractCallFilterOption()
    const startTime2 = new Date().getTime()
    await actions.waitForElement(ActivityTabPage.contractCallFilterOption)
    const endTime2 = new Date().getTime()
    await actions.reportUIPerformance(
      startTime2,
      endTime2,
      'performanceContractFiltering',
      1,
      3
    )
    await Assert.isNotVisible(ActivityTabPage.bridgeSVG)
    await Assert.isVisible(ActivityTabPage.arrowSVG)
    await Assert.isVisible(ActivityTabPage.linkSVG)
    await Assert.hasText(
      ActivityTabPage.selectFilterDropdown,
      'Display: Contract Call'
    )
  })

  it('should show bridge transactions only in list', async () => {
    await ActivityTabPage.tapFilterDropdown()
    await ActivityTabPage.tapBridgeFilterOption()
    const startTime = new Date().getTime()
    await actions.waitForElement(ActivityTabPage.bridgeFilterOption)
    const endTime = new Date().getTime()
    await actions.reportUIPerformance(
      startTime,
      endTime,
      'performanceBridgeFiltering',
      1,
      3
    )
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
    const startTime = new Date().getTime()
    await actions.waitForElement(ActivityTabPage.incomingFilterOption)
    const endTime = new Date().getTime()
    await actions.reportUIPerformance(
      startTime,
      endTime,
      'performanceIncomingFiltering',
      1,
      3
    )
    await Assert.hasText(
      ActivityTabPage.selectFilterDropdown,
      'Display: Incoming'
    )
  })

  it('should display outgoing transaction details', async () => {
    await ActivityTabPage.tapFilterDropdown()
    await ActivityTabPage.tapOutgingFilterOption()
    const startTime = new Date().getTime()
    await actions.waitForElement(ActivityTabPage.outgoingFilterOption)
    const endTime = new Date().getTime()
    await actions.reportUIPerformance(
      startTime,
      endTime,
      'performanceOutgoingFiltering',
      1,
      3
    )
    await Assert.hasText(
      ActivityTabPage.selectFilterDropdown,
      'Display: Outgoing'
    )
    await ActivityTabPage.tapArrowIcon(0)
    await Assert.isVisible(TransactionDetailsPage.status)
    await Assert.isVisible(TransactionDetailsPage.transactionType)
  })
})
