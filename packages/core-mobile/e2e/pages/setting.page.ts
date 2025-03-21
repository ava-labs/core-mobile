import Actions from '../helpers/actions'
import securityAndPrivacyLoc from '../locators/burgerMenu/securityAndPrivacy.loc'
import settingsLoc from '../locators/settings.loc'

class Settings {
  get eyeIcon() {
    return by.id(settingsLoc.eyeIcon)
  }

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

  get analyticsOn() {
    return by.id(securityAndPrivacyLoc.analyticsOn)
  }

  get analyticsOff() {
    return by.id(securityAndPrivacyLoc.analyticsOff)
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

  async tapConnectedSites() {
    await Actions.tapElementAtIndex(this.connectedSites, 0)
  }

  async goToConnectedSites() {
    await burgerMenuPage.tapBurgerMenuButton()
    await burgerMenuPage.tapSecurityAndPrivacy()
    await this.tapConnectedSites()
  }

  async verifyAnalyticsSwitch(isOn = true) {
    if (isOn) {
      await Actions.waitForElement(this.analyticsOn)
    } else {
      await Actions.waitForElement(this.analyticsOff)
    }
  }

  async tapAnalyticsSwitch(isOn = true) {
    if (isOn) {
      await Actions.tap(this.analyticsOff)
    } else {
      await Actions.tap(this.analyticsOn)
    }
  }
}

export default new Settings()
