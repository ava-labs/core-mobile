/* eslint-disable jest/expect-expect */
import Assert from '../../helpers/assertions'
import AccountManagePage from '../../pages/accountManage.page'
import WatchListPage from '../../pages/watchlist.page'
import ExistingRecoveryPhrasePage from '../../pages/existingRecoveryPhrase.page'
import SendPage from '../../pages/send.page'
import sendLoc from '../../locators/send.loc'
import ActivityTabPage from '../../pages/activityTab.page'
import ActivityTabLoc from '../../locators/activityTab.loc'
import PortfolioPage from '../../pages/portfolio.page'
import { warmup } from '../../helpers/warmup'

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
  })

  it('should successfully navigate to send and review screen', async () => {
    const secondAccountAddress = await AccountManagePage.createSecondAccount()
    await PortfolioPage.tapAvaxNetwork()
    await PortfolioPage.tapActivityTab()
    await SendPage.sendTokenTo2ndAccount(
      sendLoc.avaxToken,
      sendLoc.sendingAmount
    )
    await ActivityTabPage.verifyOutgoingTransaction(
      10000,
      secondAccountAddress,
      ActivityTabLoc.avaxOutgoingTransactionDetail
    )
  })

  it('should successfully send the token and take user to portfolio page', async () => {
    await ActivityTabPage.tapHeaderBack()
    await Assert.isVisible(PortfolioPage.activityTab)
  })
})
