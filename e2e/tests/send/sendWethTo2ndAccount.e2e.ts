/* eslint-disable jest/expect-expect */
import Assert from '../../helpers/assertions'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import AccountManagePage from '../../pages/accountManage.page'
import ActivityTabPage from '../../pages/activityTab.page'
import ActivityTabLoc from '../../locators/activityTab.loc'
import ReviewAndSend from '../../pages/reviewAndSend.page'
import BottomTabsPage from '../../pages/bottomTabs.page'
import delay from '../../helpers/waits'
import PortfolioPage from '../../pages/portfolio.page'
import PlusMenuPage from '../../pages/plusMenu.page'
import TransactionDetailsPage from '../../pages/transactionDetails.page'
import SendPage from '../../pages/send.page'
import actions from '../../helpers/actions'
import { warmup } from '../../helpers/warmup'

const jestExpect = require('expect')

describe('Send Avax to another account', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('Should send WETH to second account', async () => {
    await AccountManagePage.tapAccountMenu()
    await AccountManagePage.tapAddEditAccounts()
    await AccountManagePage.tapAddAccountButton()
    const secondAccountAddress = await AccountManagePage.getSecondAvaxAddress()
    await AccountManagePage.tapAccountMenu()
    await AccountManagePage.tapDoneButton()
    await PortfolioPage.tapActivityTab()

    await BottomTabsPage.tapPlusIcon()
    await PlusMenuPage.tapSendButton()
    await SendPage.tapAddressBook()
    await SendPage.tapMyAccounts()
    await AccountManagePage.tapSecondAccount()
    await SendPage.tapCarrotSVG()
    await SendPage.selectToken('WETH.e')
    await SendPage.enterAmount('0.0001')
    await SendPage.tapSendTitle()
    await SendPage.tapNextButton()
    await ReviewAndSend.tapSendNow()

    await actions.waitForElementNotVisible(ReviewAndSend.sendSuccessfulToastMsg)
    await delay(5000)
    await ActivityTabPage.refreshActivityPage()
    await ActivityTabPage.tapArrowIcon(0)
    const isTransactionSuccessful =
      await TransactionDetailsPage.isDateTextOlderThan(300)
    console.log(isTransactionSuccessful)
    await Assert.hasText(ActivityTabPage.address, secondAccountAddress)
    await Assert.hasText(
      ActivityTabPage.activityDetail,
      ActivityTabLoc.wethOutgoingTransactionDetail
    )
    jestExpect(isTransactionSuccessful).toBe(true)
  })

  it('Should receive WETH on second account', async () => {
    await ActivityTabPage.tapHeaderBack()
    await AccountManagePage.tapAccountMenu()
    const firstAccountAddress = await AccountManagePage.getFirstAvaxAddress()
    await AccountManagePage.tapSecondAccount()
    await PortfolioPage.tapActivityTab()
    await ActivityTabPage.tapArrowIcon(0)
    const isTransactionSuccessful =
      await TransactionDetailsPage.isDateTextOlderThan(300)
    console.log(isTransactionSuccessful)
    await Assert.hasText(ActivityTabPage.address, firstAccountAddress)
    await Assert.hasText(
      ActivityTabPage.activityDetail,
      ActivityTabLoc.wethIncomingTransactionDetail
    )
  })
})
