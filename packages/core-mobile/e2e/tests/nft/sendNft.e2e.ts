import AccountManagePage from '../../pages/accountManage.page'
import PortfolioPage from '../../pages/portfolio.page'
import CollectiblesPage from '../../pages/collectibles.page'
import { warmup } from '../../helpers/warmup'
import activityTabPage from '../../pages/activityTab.page'
import { cleanup } from '../../helpers/cleanup'
import sendPage from '../../pages/send.page'

describe('Send NFT', () => {
  beforeAll(async () => {
    await warmup()
    await AccountManagePage.createSecondAccount()
  })

  afterAll(async () => {
    await cleanup()
  })

  let account = 'first'

  it('should send NFT', async () => {
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
    await sendPage.verifySuccessToast()
  }, 200000)

  it('should verify NFT transaction on activity tab', async () => {
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
