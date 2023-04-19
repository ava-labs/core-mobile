/* eslint-disable jest/expect-expect */
/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import Assert from '../../helpers/assertions'
// import Actions from '../../helpers/actions'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import BurgerMenuPage from '../../pages/burgerMenu.page'
import { warmup } from '../../helpers/warmup'
// import { delay } from '../../helpers'

describe('Enable Testnet', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('Should verify changing currency to EUR', async () => {
    await BurgerMenuPage.tapBurgerMenuButton()
    await BurgerMenuPage.tapCurrency()
    await BurgerMenuPage.tapEuroCurrency()
    await Assert.isVisible(BurgerMenuPage.euroSign)
    await BurgerMenuPage.swipeLeft()
  })

  it('Should verify changing currency to USD', async () => {
    await BurgerMenuPage.tapBurgerMenuButton()
    await BurgerMenuPage.tapCurrency()
    await BurgerMenuPage.tapUSDCurrency()
    await Assert.isVisible(BurgerMenuPage.usdSign)
    await BurgerMenuPage.swipeLeft()
    // await Actions.waitForElement(BurgerMenuPage.usdSign)
    // await Assert.isVisible(BurgerMenuPage.usdSign)
  })
})
