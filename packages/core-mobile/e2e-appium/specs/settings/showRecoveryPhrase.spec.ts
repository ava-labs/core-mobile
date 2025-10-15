import assert from 'assert'
import { actions } from '../../helpers/actions'
import warmup from '../../helpers/warmup'
import onboardingPage from '../../pages/onboarding.page'
import settings from '../../pages/settings.page'

describe('Settings', () => {
  it('Recovery Phrase - Should verify the mnemonic phrase', async () => {
    await warmup()
    await settings.goSettings()
    await settings.tapSecurityAndPrivacy()
    await settings.tapShowRecoveryPhrase()
    await settings.enterCurrentPin()
    await actions.waitFor(settings.showRecoveryPhraseTitle)
    const words = await onboardingPage.getMnemonicWords()
    const joinedWords = words.join(' ')
    assert(
      joinedWords === process.env.E2E_MNEMONIC,
      'Displayed mnemonic does not match the expected mnemonic'
    )
  })
})
