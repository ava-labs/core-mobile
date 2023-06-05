/* eslint-disable jest/expect-expect */
import Assert from '../../helpers/assertions'
import actions from '../../helpers/actions'
import AccountManagePage from '../../pages/accountManage.page'
import ActivityTabPage from '../../pages/activityTab.page'
import ActivityTabLoc from '../../locators/activityTab.loc'
import BottomTabsPage from '../../pages/bottomTabs.page'
import BurgerMenuPage from '../../pages/burgerMenu/burgerMenu.page'
import delay from '../../helpers/waits'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import NetworksManagePage from '../../pages/networksManage.page'
import PortfolioPage from '../../pages/portfolio.page'
import PlusMenuPage from '../../pages/plusMenu.page'
import ReviewAndSend from '../../pages/reviewAndSend.page'
import SendPage from '../../pages/send.page'
import TransactionDetailsPage from '../../pages/transactionDetails.page'
import { warmup } from '../../helpers/warmup'

const jestExpect = require('expect')

describe('Send Goerly Eth to another account', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('Should send Goerly Eth to second account', async () => {
    await BurgerMenuPage.tapBurgerMenuButton()
    await BurgerMenuPage.tapAdvanced()
    await BurgerMenuPage.switchToTestnet()
    await BurgerMenuPage.tapBackbutton()
    await BurgerMenuPage.swipeLeft()
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapManageNetworks()
    await NetworksManagePage.tapNetworksTab()
    await NetworksManagePage.tapEthereumGoerliNetwork()

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
    await SendPage.selectToken('ETH')
    await SendPage.enterAmount('0.0001')
    await SendPage.tapSendTitle()
    await SendPage.tapNextButton()
    await ReviewAndSend.tapSendNow()

    await actions.waitForElementNotVisible(ReviewAndSend.sendSuccessfulToastMsg)
    await delay(40000)
    await ActivityTabPage.refreshActivityPage()
    await ActivityTabPage.tapArrowIcon(0)
    const isTransactionSuccessful =
      await TransactionDetailsPage.isDateTextOlderThan(300)
    console.log(isTransactionSuccessful)
    await Assert.hasText(ActivityTabPage.address, secondAccountAddress)
    await Assert.hasText(
      ActivityTabPage.activityDetail,
      ActivityTabLoc.ethOutgoingTransactionDetail
    )
    jestExpect(isTransactionSuccessful).toBe(true)
  })

  it('Should receive Goerly Eth on second account', async () => {
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
      ActivityTabLoc.ethIncomingTransactionDetail
    )
  })
})
