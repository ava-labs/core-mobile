import { warmup } from '../../../helpers/warmup'
import browserPage from '../../../pages/browser.page'
import plusMenuPage from '../../../pages/plusMenu.page'
import connectToSitePage from '../../../pages/connectToSite.page'
import popUpModalPage from '../../../pages/popUpModal.page'

describe('Dapp Wallet Connect - Others', () => {
  beforeEach(async () => {
    await warmup(true)
  })

  it('should connect UniSwap via Wallet Connect', async () => {
    await browserPage.connectTo('https://app.uniswap.org/')
    const qrUri = await browserPage.getQrUri()
    await plusMenuPage.connectWallet(qrUri)
    await connectToSitePage.selectAccountAndconnect()
    await popUpModalPage.verifySuccessToast()
  })

  it('should connect TraderJoe via Wallet Connect', async () => {
    await browserPage.connectLFJ()
  })

  it('should connect Benqi via Wallet Connect', async () => {
    await browserPage.connectTo('https://app.benqi.fi/markets')
    const qrUri = await browserPage.getQrUri()
    await plusMenuPage.connectWallet(qrUri)
    await connectToSitePage.selectAccountAndconnect()
    await popUpModalPage.verifySuccessToast()
  })
})
