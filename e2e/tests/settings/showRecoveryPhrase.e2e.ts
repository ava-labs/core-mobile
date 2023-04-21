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

describe('Show Recovery Phrase', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('Should set new Pin & verify pin Headers', async () => {
    await BurgerMenuPage.tapBurgerMenuButton()
    await BurgerMenuPage.tapSecurityAndPrivacy()
    await BurgerMenuPage.tapShowRecoveryPhrase()
    await Assert.isVisible(BurgerMenuPage.enterYourPinHeader)
    await CreatePinPage.enterCurrentPin()
    await Assert.isVisible(BurgerMenuPage.copyPhraseButton)
    await Assert.isVisible(BurgerMenuPage.firstMnemonicWord)
    await Assert.isVisible(BurgerMenuPage.lastMnemonicWord)
    await BurgerMenuPage.tapIWroteItDownButton()
    await Assert.isVisible(BurgerMenuPage.securityAndPrivacy)
  })
})
