/* eslint-disable jest/expect-expect */
/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import Assert from '../../helpers/assertions'
import Actions from '../../helpers/actions'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import BurgerMenuPage from '../../pages/burgerMenu.page'
import { warmup } from '../../helpers/warmup'
import { Platform } from '../../helpers/constants'

const platformIndex = Actions.platform() === Platform.iOS ? 1 : 0

describe('Change Currency', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('Should verify changing currency to EUR', async () => {
    await BurgerMenuPage.tapBurgerMenuButton()
    await BurgerMenuPage.tapCurrency()
    await BurgerMenuPage.tapEuroCurrency()
    await Assert.isVisible(BurgerMenuPage.euroSign, platformIndex)
    await BurgerMenuPage.swipeLeft()
  })

  it('Should verify changing currency to USD', async () => {
    await BurgerMenuPage.tapBurgerMenuButton()
    await BurgerMenuPage.tapCurrency()
    await BurgerMenuPage.tapUSDCurrency()
    await Assert.isVisible(BurgerMenuPage.usdSign, platformIndex)
    await BurgerMenuPage.swipeLeft()
  })
})
