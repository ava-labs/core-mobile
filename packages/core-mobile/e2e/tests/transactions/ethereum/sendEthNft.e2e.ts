import AccountManagePage from '../../../pages/accountManage.page'
import PortfolioPage from '../../../pages/portfolio.page'
import CollectiblesPage from '../../../pages/collectibles.page'
import { warmup } from '../../../helpers/warmup'
import { cleanup } from '../../../helpers/cleanup'
import sendPage from '../../../pages/send.page'
import networksManagePage from '../../../pages/networksManage.page'

describe('Ethereum NFT Transaction', () => {
  beforeAll(async () => {
    await warmup()
    await AccountManagePage.createSecondAccount()
    await networksManagePage.switchNetwork('Ethereum')
  })

  afterAll(async () => {
    await cleanup()
  })

  it('should send Ethereum NFT', async () => {
    await PortfolioPage.tapCollectiblesTab()
    await CollectiblesPage.tapListSvg()
    await CollectiblesPage.scrollToNFT()
    await CollectiblesPage.tapNFT()
    await CollectiblesPage.verifyNftDetailsItems()
    await CollectiblesPage.sendNft('first', false)
    await sendPage.verifySuccessToast()
  }, 200000)
})
