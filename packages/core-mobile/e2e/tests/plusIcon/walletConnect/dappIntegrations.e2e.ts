import { warmup } from '../../../helpers/warmup'
import browserPage from '../../../pages/browser.page'
import plusMenuPage from '../../../pages/plusMenu.page'
import connectToSitePage from '../../../pages/connectToSite.page'
import connectedSitesPage from '../../../pages/connectedSites.page'
import securityAndPrivacyPage from '../../../pages/burgerMenu/securityAndPrivacy.page'

describe('Dapp Testing: Wallet Connect', () => {
  beforeAll(async () => {
    await warmup()
  })

  enum Dapps {
    aave = 'Aave - Open Source Liquidity Protocol',
    traderjoe = 'Trader Joe',
    openSea = 'OpenSea, the largest NFT marketplace'
  }

  it('should connect Aave', async () => {
    await browserPage.connectTo('https://app.aave.com/')
    const qrUri = await browserPage.getQrUri()
    await plusMenuPage.connectWallet(qrUri)
    await connectToSitePage.selectAccountAndconnect(Dapps.aave)
  })

  it('should connect TraderJoe', async () => {
    await browserPage.connectTo('https://traderjoexyz.com/avalanche')
    const qrUri = await browserPage.getQrUri()
    await plusMenuPage.connectWallet(qrUri)
    await connectToSitePage.selectAccountAndconnect(Dapps.traderjoe)
  })

  it('should connect OpenSea', async () => {
    await browserPage.connectTo('https://opensea.io/', true)
    const qrUri = await browserPage.getQrUri()
    await plusMenuPage.connectWallet(qrUri)
    await connectToSitePage.selectAccountAndconnect(Dapps.openSea)
    await connectToSitePage.approveSignMessage(Dapps.openSea)
  })

  it('should show connected dApps', async () => {
    await securityAndPrivacyPage.goToConnectedSites()
    for (const key in Dapps) {
      const value = Dapps[key as keyof typeof Dapps]
      await connectedSitesPage.verifyDapp(value)
    }
  })
})
