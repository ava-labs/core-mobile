import Actions from '../../helpers/actions'
import securityAndPrivacyLoc from '../../locators/burgerMenu/securityAndPrivacy.loc'

class SecurityAndPrivacy {
  get changePin() {
    return by.text(securityAndPrivacyLoc.changePin)
  }

  get connectedSites() {
    return by.text(securityAndPrivacyLoc.connectedSites)
  }

  get showRecoveryPhrase() {
    return by.text(securityAndPrivacyLoc.showRecoveryPhrase)
  }

  get participateInCoreAnalytics() {
    return by.text(securityAndPrivacyLoc.participateInCoreAnalytics)
  }

  get copyPhraseButton() {
    return by.text(securityAndPrivacyLoc.copyPhraseButton)
  }

  get firstMnemonicWord() {
    return by.text(securityAndPrivacyLoc.firstMnemonicWord)
  }

  get lastMnemonicWord() {
    return by.text(securityAndPrivacyLoc.lastMnemonicWord)
  }

  get iWroteItDownButton() {
    return by.text(securityAndPrivacyLoc.iWroteItDownButton)
  }

  async tapChangePin() {
    await Actions.tapElementAtIndex(this.changePin, 0)
  }

  async tapShowRecoveryPhrase() {
    await Actions.tapElementAtIndex(this.showRecoveryPhrase, 0)
  }

  async tapIWroteItDownButton() {
    await Actions.tapElementAtIndex(this.iWroteItDownButton, 0)
  }
}

export default new SecurityAndPrivacy()
