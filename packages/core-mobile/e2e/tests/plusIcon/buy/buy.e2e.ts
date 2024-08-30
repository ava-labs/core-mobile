import { warmup } from '../../../helpers/warmup'
import bottomTabsPage from '../../../pages/bottomTabs.page'
import plusMenuPage from '../../../pages/plusMenu.page'
import buyPage from '../../../pages/buy.page'
import delay from '../../../helpers/waits'

describe('Buy', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should navigate Moonpay to buy AVAX', async () => {
    await bottomTabsPage.tapPlusIcon()
    await plusMenuPage.tapBuyButton()
    await buyPage.verifyBuyPage()
    await buyPage.tapMoonPay()
    await buyPage.verifyReadCarefully('Moonpay')
    await buyPage.tapConfirm()

    await delay(3000)
    // Use the mock function to check the URL
    const url = await require('react-native-inappbrowser-reborn').open.mock
      .calls[0][0]

    console.log(url)
    console.log('yo')
  })

  //   it('should navigate Coinbase Pay to buy AVAX', async () => {
  //     await bottomTabsPage.tapPlusIcon()
  //     await plusMenuPage.tapBuyButton()
  //     await buyPage.verifyBuyPage()
  //     await buyPage.tapCoinbasePay()
  //     await buyPage.verifyReadCarefully('Coinbase Pay')
  //     await buyPage.tapConfirm()
  //   })
})
