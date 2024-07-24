import { warmup } from '../../../helpers/warmup'
import browserPage from '../../../pages/browser.page'
import plusMenuPage from '../../../pages/plusMenu.page'
import connectToSitePage from '../../../pages/connectToSite.page'
import securityAndPrivacyPage from '../../../pages/burgerMenu/securityAndPrivacy.page'
import connectedSitesPage from '../../../pages/connectedSites.page'

describe('Connect to dApp using WalletConnect', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should connect Aave', async () => {
    const aave = 'Aave - Open Source Liquidity Protocol'
    await browserPage.connectTo('https://app.aave.com/')
    const qrUri = await browserPage.getQrUri()
    await plusMenuPage.connectWallet(qrUri)
    await connectToSitePage.selectAccountAndconnect(aave)
    await securityAndPrivacyPage.goToConnectedSites()
    await connectedSitesPage.verifyDapp(aave)
    await connectedSitesPage.goBackToPortfolio()
  })

  it('should connect TraderJoe', async () => {
    const traderjoe = 'Trader Joe'
    await browserPage.connectTo('https://traderjoexyz.com/avalanche')
    const qrUri = await browserPage.getQrUri()
    await plusMenuPage.connectWallet(qrUri)
    await connectToSitePage.selectAccountAndconnect(traderjoe)
    await securityAndPrivacyPage.goToConnectedSites()
    await connectedSitesPage.verifyDapp(traderjoe)
    await connectedSitesPage.goBackToPortfolio()
  })

  it('should connect OpenSea', async () => {
    const openSea = 'OpenSea, the largest NFT marketplace'
    await browserPage.connectTo('https://opensea.io/', true)
    const qrUri = await browserPage.getQrUri()
    await plusMenuPage.connectWallet(qrUri)
    await connectToSitePage.selectAccountAndconnect(openSea)
    await connectToSitePage.approveSignMessage(openSea)
    await securityAndPrivacyPage.goToConnectedSites()
    await connectedSitesPage.verifyDapp(openSea)
  })
})
