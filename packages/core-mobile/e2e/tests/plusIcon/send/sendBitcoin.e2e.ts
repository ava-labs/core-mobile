import actions from '../../../helpers/actions'
import { cleanup } from '../../../helpers/cleanup'
import { warmup } from '../../../helpers/warmup'
import sendLoc from '../../../locators/send.loc'
import accountManagePage from '../../../pages/accountManage.page'
import activityTabPage from '../../../pages/activityTab.page'
import bottomTabsPage from '../../../pages/bottomTabs.page'
import advancedPage from '../../../pages/burgerMenu/advanced.page'
import networksManagePage from '../../../pages/networksManage.page'
import portfolioPage from '../../../pages/portfolio.page'
import sendPage from '../../../pages/send.page'

describe('Send BTC', () => {
  beforeAll(async () => {
    await warmup()
  })

  afterAll(async () => {
    await cleanup()
  })

  it('Should switch to Bitcoin TestNet', async () => {
    await bottomTabsPage.tapPortfolioTab()
    await advancedPage.switchToTestnet()
    await networksManagePage.switchToBitcoinTestNet()
    await actions.waitForElement(
      networksManagePage.bitcoinTestnetNetwork,
      60000
    )
  }, 120000)

  it('Should send Bitcoin Testnet', async () => {
    await accountManagePage.createSecondAccount()
    await sendPage.sendTokenTo2ndAccount(sendLoc.btcToken, '0.0001')
    await sendPage.verifySuccessToast()
  })

  it('Should verify the BTC transaction on TestNet ', async () => {
    await networksManagePage.tapBitcoinTestNetwork(1)
    await portfolioPage.tapActivityTab()
    const sendRow = await activityTabPage.getLatestActivityRow()
    await activityTabPage.verifyActivityRow(sendRow, 'Send')

    await accountManagePage.switchToSecondAccount()
    const receiveRow = await activityTabPage.getLatestActivityRow()
    await activityTabPage.verifyActivityRow(receiveRow, 'Receive')
    await accountManagePage.switchToFirstAccount()
  })
})
