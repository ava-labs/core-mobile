/* eslint-disable jest/expect-expect */
/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import Assert from '../../helpers/assertions'
import Actions from '../../helpers/actions'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import BurgerMenuPage from '../../pages/burgerMenu/burgerMenu.page'
import { warmup } from '../../helpers/warmup'
import CreatePinPage from '../../pages/createPin.page'
import SecurityAndPrivacyPage from '../../pages/burgerMenu/securityAndPrivacy.page'

describe('Change Pin', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('Should set new Pin & verify pin Headers', async () => {
    await BurgerMenuPage.tapBurgerMenuButton()
    await BurgerMenuPage.tapSecurityAndPrivacy()
    const startTime = new Date().getTime()
    await Actions.waitForElement(SecurityAndPrivacyPage.changePin)
    const endTime = new Date().getTime()
    await Actions.reportUIPerformance(
      startTime,
      endTime,
      'Security&PrivacyScreen',
      1,
      3
    )
    await SecurityAndPrivacyPage.tapChangePin()
    await Assert.isVisible(CreatePinPage.enterYourPinHeader)
    await CreatePinPage.enterCurrentPin()
    await Assert.isVisible(CreatePinPage.setNewPinHeader)
    await CreatePinPage.createNewPin()
    await CreatePinPage.createNewPin()
    await Assert.isVisible(BurgerMenuPage.securityAndPrivacy)
  })

  it('Should set previous Pin', async () => {
    await SecurityAndPrivacyPage.tapChangePin()
    await Assert.isVisible(CreatePinPage.enterYourPinHeader)
    await CreatePinPage.enterNewCurrentPin()
    await Assert.isVisible(CreatePinPage.setNewPinHeader)
    await CreatePinPage.createPin()
    await CreatePinPage.createPin()
    await Assert.isVisible(BurgerMenuPage.securityAndPrivacy)
  })
})
