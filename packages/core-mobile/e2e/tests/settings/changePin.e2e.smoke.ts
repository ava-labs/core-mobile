/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import Assert from '../../helpers/assertions'
import Actions from '../../helpers/actions'
import BurgerMenuPage from '../../pages/burgerMenu/burgerMenu.page'
import { handleJailbrokenWarning, warmup } from '../../helpers/warmup'
import CreatePinPage from '../../pages/createPin.page'
import SecurityAndPrivacyPage from '../../pages/burgerMenu/securityAndPrivacy.page'
import portfolioPage from '../../pages/portfolio.page'
import delay from '../../helpers/waits'

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
    const platform = Actions.platform()
    if (platform === 'android') {
      await device.reloadReactNative()
      await delay(10000)
      await device.launchApp({ newInstance: false })
      await handleJailbrokenWarning()
      await CreatePinPage.enterNewCurrentPin()
      await portfolioPage.verifyPorfolioScreen()
      await BurgerMenuPage.tapBurgerMenuButton()
      await BurgerMenuPage.tapSecurityAndPrivacy()
    }
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
