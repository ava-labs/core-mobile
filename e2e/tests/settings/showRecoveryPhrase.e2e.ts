/* eslint-disable jest/expect-expect */
/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import Assert from '../../helpers/assertions'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import BurgerMenuPage from '../../pages/burgerMenu/burgerMenu.page'
import { warmup } from '../../helpers/warmup'
import CreatePinPage from '../../pages/createPin.page'
import SecurityAndPrivacyPage from '../../pages/burgerMenu/securityAndPrivacy.page'

describe('Show Recovery Phrase', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('Should verify first and last word of mnemonic presented', async () => {
    await BurgerMenuPage.tapBurgerMenuButton()
    await BurgerMenuPage.tapSecurityAndPrivacy()
    await SecurityAndPrivacyPage.tapShowRecoveryPhrase()
    await Assert.isVisible(CreatePinPage.enterYourPinHeader)
    await CreatePinPage.enterCurrentPin()
    await Assert.isVisible(SecurityAndPrivacyPage.copyPhraseButton)
    await Assert.isVisible(SecurityAndPrivacyPage.firstMnemonicWord)
    await Assert.isVisible(SecurityAndPrivacyPage.lastMnemonicWord)
    await SecurityAndPrivacyPage.tapIWroteItDownButton()
    await Assert.isVisible(BurgerMenuPage.securityAndPrivacy)
  })
})
