/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import Assert from '../../helpers/assertions'
import Actions from '../../helpers/actions'
import BurgerMenuPage from '../../pages/burgerMenu/burgerMenu.page'
import { warmup } from '../../helpers/warmup'
import CreatePinPage from '../../pages/createPin.page'
import SecurityAndPrivacyPage from '../../pages/burgerMenu/securityAndPrivacy.page'
import portfolioPage from '../../pages/portfolio.page'

describe('Change Pin', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('Should set new Pin & verify pin Headers', async () => {
    await BurgerMenuPage.tapBurgerMenuButton()
    await BurgerMenuPage.tapSecurityAndPrivacy()
    await Actions.waitForElement(SecurityAndPrivacyPage.changePin)
    await SecurityAndPrivacyPage.tapChangePin()
    await Assert.isVisible(CreatePinPage.enterYourPinHeader)
    await CreatePinPage.enterCurrentPin()
    await Assert.isVisible(CreatePinPage.setNewPinHeader)
    await CreatePinPage.createNewPin()
    await Assert.isVisible(BurgerMenuPage.securityAndPrivacy)
    await device.reloadReactNative()
    await CreatePinPage.enterNewCurrentPin()
    await portfolioPage.verifyPorfolioScreen()
    await BurgerMenuPage.tapBurgerMenuButton()
    await BurgerMenuPage.tapSecurityAndPrivacy()
  })

  it('Should set previous Pin', async () => {
    await Actions.waitForElement(SecurityAndPrivacyPage.changePin)
    await SecurityAndPrivacyPage.tapChangePin()
    await Assert.isVisible(CreatePinPage.enterYourPinHeader)
    await CreatePinPage.enterNewCurrentPin()
    await Assert.isVisible(CreatePinPage.setNewPinHeader)
    await CreatePinPage.createPin()
  })
})
