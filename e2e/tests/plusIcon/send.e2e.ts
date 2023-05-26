/* eslint-disable jest/expect-expect */
/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import { Platform } from '../../helpers/constants'
import Assert from '../../helpers/assertions'
import WatchListPage from '../../pages/watchlist.page'
import PlusMenuPage from '../../pages/plusMenu.page'
import ExistingRecoveryPhrasePage from '../../pages/existingRecoveryPhrase.page'
import BottomTabsPage from '../../pages/bottomTabs.page'
import SendPage from '../../pages/send.page'
import ReviewAndSend from '../../pages/reviewAndSend.page'
import ActivityTabPage from '../../pages/activityTab.page'
import PortfolioPage from '../../pages/portfolio.page'
import delay from '../../helpers/waits'
import actions from '../../helpers/actions'
import transactionDetailsPage from '../../pages/transactionDetails.page'
import { warmup } from '../../helpers/warmup'

const jestExpect = require('expect')

describe('Send AVAX', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should validate watchlist is shown', async () => {
    await Assert.isVisible(WatchListPage.newWalletIcon, 1)
    await Assert.isVisible(WatchListPage.newWalletBtn)
    await Assert.isVisible(WatchListPage.walletSVG, 1)
  })

  it('should navigate to send screen', async () => {
    const recoveryPhrase: string = process.env.E2E_MNEMONIC as string
    await ExistingRecoveryPhrasePage.recoverWallet(recoveryPhrase)
    await PortfolioPage.tapActivityTab()
    await BottomTabsPage.tapPlusIcon()
    await PlusMenuPage.tapSendButton()
  })

  it('should successfully navigate to send and review screen', async () => {
    const walletAddress: string = process.env.TEST_ADDRESS as string
    await SendPage.enterWalletAddress(walletAddress)
    await SendPage.tapCarrotSVG()
    await SendPage.selectToken('AVAX')
    await SendPage.enterAmount('0.01')
    await SendPage.tapSendTitle()
    await SendPage.tapNextButton()
    await Assert.isVisible(ReviewAndSend.amount)
    await Assert.isVisible(ReviewAndSend.balanceAfterTransaction)
    await Assert.isVisible(ReviewAndSend.networkFee)
    await Assert.isVisible(ReviewAndSend.reviewAndSendNow)
  })

  it('should successfully send the token and take user to portfolio page', async () => {
    await ReviewAndSend.tapSendNow()
    await Assert.isVisible(ReviewAndSend.sendPendingToastMsg)
    if (actions.platform() === Platform.iOS) {
      await Assert.isVisible(ReviewAndSend.sendSuccessfulToastMsg)
    }
    await actions.waitForElementNotVisible(ReviewAndSend.sendSuccessfulToastMsg)
    await delay(40000)
    await ActivityTabPage.refreshActivityPage()
    await ActivityTabPage.tapArrowIcon(0)
    const isTransactionSuccessful =
      await transactionDetailsPage.isDateTextOlderThan(300)
    console.log(isTransactionSuccessful)
    jestExpect(isTransactionSuccessful).toBe(true)
  })
})
