/* eslint-disable jest/expect-expect */
/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import Assert from '../../helpers/assertions'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import BurgerMenuPage from '../../pages/burgerMenu.page'
import { warmup } from '../../helpers/warmup'
import CreatePinPage from '../../pages/createPin.page'

describe('Change Pin', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('Should set new Pin & verify pin Headers', async () => {
    await BurgerMenuPage.tapBurgerMenuButton()
    await BurgerMenuPage.tapSecurityAndPrivacy()
    await BurgerMenuPage.tapChangePin()
    await Assert.isVisible(BurgerMenuPage.enterYourPinHeader)
    await CreatePinPage.enterCurrentPin()
    await Assert.isVisible(BurgerMenuPage.setNewPinHeader)
    await CreatePinPage.createNewPin()
    await Assert.isVisible(BurgerMenuPage.securityAndPrivacy)
  })

  it('Should set previous Pin', async () => {
    await BurgerMenuPage.tapChangePin()
    await Assert.isVisible(BurgerMenuPage.enterYourPinHeader)
    await CreatePinPage.enterNewCurrentPin()
    await Assert.isVisible(BurgerMenuPage.setNewPinHeader)
    await CreatePinPage.createPin()
    await Assert.isVisible(BurgerMenuPage.securityAndPrivacy)
  })
})
