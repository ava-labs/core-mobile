/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import assert from 'assert'
import { warmup } from '../../helpers/warmup'
import settingsPage from '../../pages/settings.page'
import commonElsPage from '../../pages/commonEls.page'
import onboardingPage from '../../pages/onboarding.page'
import actions from '../../helpers/actions'
import { ENV } from '../../helpers/getEnvs'

describe('Settings - Show Recovery Phrase', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('Should verify the mnemonic phrase', async () => {
    await settingsPage.goSettings()
    await settingsPage.tapSecurityAndPrivacy()
    await settingsPage.tapShowRecoveryPhrase()
    await commonElsPage.enterPin()
    await settingsPage.verifyShowRecoveryPhraseScreen()
    const words = await onboardingPage.getMnemonicWords()
    const joinedWords = words.join(' ')
    assert(
      joinedWords === ENV.E2E_MNEMONIC,
      'Displayed mnemonic does not match the expected mnemonic'
    )
  })

  it('Should be able to copy the phrase', async () => {
    await commonElsPage.tapCopyPhrase()
    await actions.waitForElement(commonElsPage.copied)
  })
})
