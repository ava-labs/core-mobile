import AccountManagePage from '../../pages/accountManage.page'
import Actions from '../../helpers/actions'
import PortfolioPage from '../../pages/portfolio.page'
import CollectiblesPage from '../../pages/collectibles.page'
import { warmup } from '../../helpers/warmup'
import activityTabPage from '../../pages/activityTab.page'
import popUpModalPage from '../../pages/popUpModal.page'

describe('Send - NFT', () => {
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
    await Actions.waitForElement(popUpModalPage.successfulToastMsg, 120000)
    await Actions.waitForElementNotVisible(
      popUpModalPage.successfulToastMsg,
      30000
    )
  }, 200000)

  it('should verify NFT transactions on activity tab', async () => {
    // sender activity tab:
    await PortfolioPage.tapAssetsTab()
    await PortfolioPage.goToActivityTab()
    await activityTabPage.verifyNewRow('Send', '-1')
    // receiver activity tab:
    await AccountManagePage.switchToReceivedAccount(account)
    await activityTabPage.refreshActivityPage()
    await activityTabPage.verifyNewRow('Contract Call', '+1')
  })
})
