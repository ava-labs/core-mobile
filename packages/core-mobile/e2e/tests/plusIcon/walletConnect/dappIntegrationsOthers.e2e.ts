import { warmup } from '../../../helpers/warmup'
import browserPage from '../../../pages/browser.page'
import plusMenuPage from '../../../pages/plusMenu.page'
import connectToSitePage from '../../../pages/connectToSite.page'

describe('Dapp Wallet Connect - Others', () => {
  beforeEach(async () => {
    await warmup(true)
  })

  it('should connect Aave via Wallet Connect', async () => {
    await browserPage.connectTo('https://app.aave.com/')
    const qrUri = await browserPage.getQrUri()
    await plusMenuPage.connectWallet(qrUri)
    await connectToSitePage.selectAccountAndconnect()
  })

  it('should connect TraderJoe via Wallet Connect', async () => {
    await browserPage.connectTo('https://traderjoexyz.com/avalanche')
    const qrUri = await browserPage.getQrUri()
    await plusMenuPage.connectWallet(qrUri)
    await connectToSitePage.selectAccountAndconnect()
  })

  it('should connect OpenSea via Wallet Connect', async () => {
    await browserPage.connectTo('https://opensea.io/', true)
    const qrUri = await browserPage.getQrUri()
    await plusMenuPage.connectWallet(qrUri)
    await connectToSitePage.selectAccountAndconnect()
    await connectToSitePage.approveSignMessage(
      'OpenSea, the largest NFT marketplace'
    )
  })
})
