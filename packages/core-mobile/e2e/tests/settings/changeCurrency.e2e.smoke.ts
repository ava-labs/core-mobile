/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import Assert from '../../helpers/assertions'
import Actions from '../../helpers/actions'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import BurgerMenuPage from '../../pages/burgerMenu/burgerMenu.page'
import { warmup } from '../../helpers/warmup'
import { Platform } from '../../helpers/constants'
import CurrencyPage from '../../pages/burgerMenu/currency.page'

const platformIndex = Actions.platform() === Platform.iOS ? 1 : 0

describe('Change Currency', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('Should verify changing currency to EUR', async () => {
    await BurgerMenuPage.tapBurgerMenuButton()
    await BurgerMenuPage.tapCurrency()
    await Actions.waitForElement(CurrencyPage.euroCurrency)
    await CurrencyPage.tapEuroCurrency()
    await Assert.isVisible(CurrencyPage.euroSign, platformIndex)
    await BurgerMenuPage.swipeLeft()
  })

  it('Should verify changing currency to USD', async () => {
    await BurgerMenuPage.tapBurgerMenuButton()
    await BurgerMenuPage.tapCurrency()
    await CurrencyPage.tapUSDCurrency()
    await Assert.isVisible(CurrencyPage.usdSign, platformIndex)
    await BurgerMenuPage.swipeLeft()
  })
})
