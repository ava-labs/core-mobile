import { warmup } from '../../helpers/warmup'
import bottomTabsPage from '../../pages/bottomTabs.page'
import buyPage from '../../pages/buy.page'
import plusMenuPage from '../../pages/plusMenu.page'

describe('Withdraw', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should navigate Moonpay to buy AVAX', async () => {
    await bottomTabsPage.tapPlusIcon()
    await plusMenuPage.tapBuyButton()
    await buyPage.verifyBuyPage()
    await buyPage.tapMoonPay()
    await buyPage.verifyReadCarefully('Moonpay')
    await buyPage.tapCancel()
  })

  it('should navigate Coinbase Pay to buy AVAX', async () => {
    await buyPage.verifyBuyPage()
    await buyPage.tapCoinbasePay()
    await buyPage.verifyReadCarefully('Coinbase Pay')
  })
})
