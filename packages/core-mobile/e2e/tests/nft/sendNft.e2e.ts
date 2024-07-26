import AccountManagePage from '../../pages/accountManage.page'
import Actions from '../../helpers/actions'
import PortfolioPage from '../../pages/portfolio.page'
import CollectiblesPage from '../../pages/collectibles.page'
import { warmup } from '../../helpers/warmup'
import approveTransactionPage from '../../pages/approveTransaction.page'
import activityTabPage from '../../pages/activityTab.page'

describe('Send Avax to another account', () => {
  beforeAll(async () => {
    await warmup()
  })

  let account = 'first'

  it('Should send NFT', async () => {
    await AccountManagePage.createSecondAccount()
    await PortfolioPage.tapCollectiblesTab()
    await CollectiblesPage.tapListSvg()
    try {
      await CollectiblesPage.scrollToMintNFT()
    } catch (e) {
      console.log(
        'Unable to find `mint` NFT on first account, switching to 2nd account'
      )
      await AccountManagePage.switchToSecondAccount()
      await CollectiblesPage.scrollToMintNFT()
      account = 'second'
    }
    await CollectiblesPage.tapMintNFT()
    await CollectiblesPage.verifyNftDetailsItems()
    await CollectiblesPage.sendNft(account)
  })

  it('Should verify NFT transaction toast', async () => {
    await Actions.waitForElement(
      approveTransactionPage.successfulToastMsg,
      120000
    )
    await Actions.waitForElementNotVisible(
      approveTransactionPage.successfulToastMsg,
      30000
    )
  }, 200000)

  it('Should receive NFT', async () => {
    await AccountManagePage.switchToReceivedAccount(account)
    await CollectiblesPage.scrollToMintNFT()
  })

  it('should verify NFT transactions on activity tab', async () => {
    // receiver activity tab:
    await PortfolioPage.tapAssetsTab()
    await PortfolioPage.tapAvaxNetwork()
    await PortfolioPage.tapActivityTab()
    await activityTabPage.verifyNewRow('Contract Call', '+1')

    // sender activity tab:
    await AccountManagePage.switchToSentAccount(account)
    await activityTabPage.verifyNewRow('Send', '-1')
  })
})
