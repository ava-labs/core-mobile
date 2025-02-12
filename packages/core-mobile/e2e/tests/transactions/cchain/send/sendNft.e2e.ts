import AccountManagePage from '../../../../pages/accountManage.page'
import PortfolioPage from '../../../../pages/portfolio.page'
import CollectiblesPage from '../../../../pages/collectibles.page'
import { warmup } from '../../../../helpers/warmup'
import activityTabPage from '../../../../pages/activityTab.page'
import { cleanup } from '../../../../helpers/cleanup'
import sendPage from '../../../../pages/send.page'

describe('Send NFT', () => {
  beforeAll(async () => {
    await warmup()
    await AccountManagePage.createSecondAccount()
  })

  afterAll(async () => {
    await cleanup()
  })

  it('should send Avalanche NFT', async () => {
    await PortfolioPage.tapCollectiblesTab()
    await CollectiblesPage.tapListSvg()
    await CollectiblesPage.scrollToNFT()
    await CollectiblesPage.tapNFT()
    await CollectiblesPage.verifyNftDetailsItems()
    await CollectiblesPage.sendNft('first')
    await sendPage.verifySuccessToast()
  }, 200000)

  it('should verify NFT transaction on activity tab', async () => {
    // sender activity tab:
    await PortfolioPage.tapAssetsTab()
    await PortfolioPage.goToActivityTab()
    await activityTabPage.verifyExistingRow('Send NFT')
    // receiver activity tab:
    await AccountManagePage.switchToReceivedAccount('first')
    await activityTabPage.refreshActivityPage()
    const row = await activityTabPage.getLatestActivityRow()
    await activityTabPage.verifyActivityRow(row, 'Receive NFT')
  })
})
