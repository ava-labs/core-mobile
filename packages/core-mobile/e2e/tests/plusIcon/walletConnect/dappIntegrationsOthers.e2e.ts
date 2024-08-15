import { warmup } from '../../../helpers/warmup'
import browserPage from '../../../pages/browser.page'
import plusMenuPage from '../../../pages/plusMenu.page'
import connectToSitePage from '../../../pages/connectToSite.page'
import connectedSitesPage from '../../../pages/connectedSites.page'
import securityAndPrivacyPage from '../../../pages/burgerMenu/securityAndPrivacy.page'

describe('Dapp Wallet Connect - Others', () => {
  beforeEach(async () => {
    await warmup(true)
  })

  enum Dapps {
    aave = 'Aave - Open Source Liquidity Protocol',
    traderjoe = 'Trader Joe',
    openSea = 'OpenSea, the largest NFT marketplace'
  }

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
    await connectToSitePage.approveSignMessage(Dapps.openSea)
  })

  it('should verify Dapps connected', async () => {
    await securityAndPrivacyPage.goToConnectedSites()
    for (const key in Dapps) {
      const value = Dapps[key as keyof typeof Dapps]
      await connectedSitesPage.verifyDapp(value)
    }
  })
})
