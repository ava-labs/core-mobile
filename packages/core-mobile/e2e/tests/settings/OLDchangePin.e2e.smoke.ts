/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import Actions from '../../helpers/actions'
import BurgerMenuPage from '../../pages/burgerMenu/burgerMenu.page'
import { warmup } from '../../helpers/warmup'
import CreatePinPage from '../../pages/createPin.page'
import SecurityAndPrivacyPage from '../../pages/burgerMenu/securityAndPrivacy.page'

describe('Change Pin', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('Should set new Pin & verify pin Headers', async () => {
    await BurgerMenuPage.tapBurgerMenuButton()
    await BurgerMenuPage.tapSecurityAndPrivacy()
    await SecurityAndPrivacyPage.tapChangePin()
    await CreatePinPage.enterCurrentPin()
    await CreatePinPage.enterNewCurrentPin()
  })

  it('Should set previous Pin', async () => {
    await Actions.waitForElement(SecurityAndPrivacyPage.changePin)
    await SecurityAndPrivacyPage.tapChangePin()
    await CreatePinPage.enterCurrentPin('1')
    await CreatePinPage.createPin()
  })
})
