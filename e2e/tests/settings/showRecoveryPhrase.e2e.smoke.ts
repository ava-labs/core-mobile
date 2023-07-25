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

describe('Show Recovery Phrase', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('Should verify first and last word of mnemonic presented', async () => {
    await BurgerMenuPage.tapBurgerMenuButton()
    await BurgerMenuPage.tapSecurityAndPrivacy()
    await SecurityAndPrivacyPage.tapShowRecoveryPhrase()
    const startTime = new Date().getTime()
    await Actions.waitForElement(CreatePinPage.enterYourPinHeader)
    const endTime = new Date().getTime()
    await Assert.isVisible(CreatePinPage.enterYourPinHeader)
    await Actions.reportUIPerformance(
      startTime,
      endTime,
      'EnterYourPinScreen',
      1,
      3
    )
    await CreatePinPage.enterCurrentPin()
    const startTime2 = new Date().getTime()
    await Actions.waitForElement(SecurityAndPrivacyPage.copyPhraseButton)
    const endTime2 = new Date().getTime()
    await Actions.reportUIPerformance(
      startTime2,
      endTime2,
      'RecoveryPhraseScreen',
      1,
      3
    )
    await Assert.isVisible(SecurityAndPrivacyPage.copyPhraseButton)
    await Assert.isVisible(SecurityAndPrivacyPage.firstMnemonicWord)
    await Assert.isVisible(SecurityAndPrivacyPage.lastMnemonicWord)
    await SecurityAndPrivacyPage.tapIWroteItDownButton()
    await Assert.isVisible(BurgerMenuPage.securityAndPrivacy)
  })
})
