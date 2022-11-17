import recoveryPhraseLoc from '../locators/existingRecoveryPhrase.loc'
import Action from '../helpers/actions'

class ExistingRecoveryPhrasePage {
  get recoveryPhraseTextInput() {
    return by.id(recoveryPhraseLoc.recoveryPhraseInput)
  }

  get signInBtn() {
    return by.text(recoveryPhraseLoc.signInBtn)
  }

  async enterRecoveryPhrase(recoveryPhrase: string) {
    await Action.setInputText(this.recoveryPhraseTextInput, recoveryPhrase)
  }

  async tapSignInBtn() {
    await Action.tap(this.signInBtn)
  }
}

export default new ExistingRecoveryPhrasePage()
