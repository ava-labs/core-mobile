import assert from 'assert'
import Actions from '../helpers/actions'
import assertions from '../helpers/assertions'
import settings from '../locators/settings.loc'
import commonElsPage from './commonEls.page'

class Settings {
  get eyeIcon() {
    return by.id(settings.eyeIcon)
  }

  get changePin() {
    return by.text(settings.changePin)
  }

  get connectedSites() {
    return by.text(settings.connectedSites)
  }

  get showRecoveryPhrase() {
    return by.text(settings.showRecoveryPhrase)
  }

  get participateInCoreAnalytics() {
    return by.text(settings.participateInCoreAnalytics)
  }

  get firstMnemonicWord() {
    return by.text(settings.firstMnemonicWord)
  }

  get lastMnemonicWord() {
    return by.text(settings.lastMnemonicWord)
  }

  get iWroteItDownButton() {
    return by.text(settings.iWroteItDownButton)
  }

  get analyticsOn() {
    return by.id(settings.analyticsOn)
  }

  get analyticsOff() {
    return by.id(settings.analyticsOff)
  }

  get settingsFooter() {
    return by.id(settings.settingsFooter)
  }

  get settingsScrollView() {
    return by.id(settings.settingsScrollView)
  }

  get advanced() {
    return by.text(settings.advanced)
  }

  get addressBook() {
    return by.text(settings.addressBook)
  }

  get currency() {
    return by.text(settings.currency)
  }

  get securityAndPrivacy() {
    return by.text(settings.securityAndPrivacy)
  }

  get securityAndPrivacyTitle() {
    return by.text(settings.securityAndPrivacyTitle)
  }

  get notificationsPreferences() {
    return by.text(settings.notificationsPreferences)
  }

  get deleteWalletBtn() {
    return by.text(settings.deleteWalletBtn)
  }

  get iUnderstandBtn() {
    return by.text(settings.iUnderstandBtn)
  }

  get appearance() {
    return by.text(settings.appearance)
  }

  get appearanceTitle() {
    return by.text(settings.appearanceTitle)
  }

  get system() {
    return by.text(settings.system)
  }

  get light() {
    return by.text(settings.light)
  }

  get dark() {
    return by.text(settings.dark)
  }

  get settingsBtn() {
    return by.id(settings.settingsBtn)
  }

  get selectCurrencyTitle() {
    return by.text(settings.selectCurrencyTitle)
  }

  get addAccountBtn() {
    return by.id(settings.addAccountBtn)
  }

  get accountList() {
    return by.id(settings.accountList)
  }

  get enterYourCurrentPinTitle() {
    return by.text(settings.enterYourCurrentPinTitle)
  }

  get enterYourNewPinTitle() {
    return by.text(settings.enterYourNewPinTitle)
  }

  get unlockWithFaceId() {
    return by.text(settings.unlockWithFaceId)
  }

  get toggleBiometricsOn() {
    return by.id(settings.toggleBiometricsOn)
  }

  get toggleBiometricsOff() {
    return by.id(settings.toggleBiometricsOff)
  }

  get confirmYourNewPinTitle() {
    return by.text(settings.confirmYourNewPinTitle)
  }

  get showRecoveryPhraseTitle() {
    return by.text(settings.showRecoveryPhraseTitle)
  }

  get showRecoveryPhraseDescription() {
    return by.text(settings.showRecoveryPhraseDescription)
  }

  get showRecoveryPhraseWarning() {
    return by.text(settings.showRecoveryPhraseWarning)
  }

  async tapAdvanced() {
    await Actions.tapElementAtIndex(this.advanced, 0)
  }

  async tapAddressBook() {
    await Actions.tapElementAtIndex(this.addressBook, 0)
  }

  async tapNotifications() {
    await this.scrollToSettingsFooter()
    await Actions.tapElementAtIndex(this.notificationsPreferences, 0)
  }
  async tapCurrencyRow() {
    await Actions.tapElementAtIndex(this.currency, 0)
  }

  async scrollToSettingsFooter() {
    const isVisible = await Actions.expectToBeVisible(this.securityAndPrivacy)
    if (!isVisible) {
      await Actions.scrollToBottom(this.settingsScrollView)
    }
  }

  async tapSecurityAndPrivacy() {
    await this.scrollToSettingsFooter()
    await Actions.tapElementAtIndex(this.securityAndPrivacy, 0)
  }

  async deleteWallet() {
    await Actions.tapElementAtIndex(this.deleteWalletBtn, 0)
    await Actions.tap(this.iUnderstandBtn)
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
      await Actions.tap(this.analyticsOn)
    } else {
      await Actions.tap(this.analyticsOff)
    }
  }

  async tapAppearanceRow() {
    await Actions.tapElementAtIndex(this.appearance, 0)
  }

  async verifySettingsRow(row: string, rightVal: string | undefined) {
    await Actions.waitForElement(by.id(`right_value__${row}`))

    if (row === 'Currency') {
      await Actions.waitForElement(by.id(`icon__${rightVal}`))
    }
    if (rightVal) {
      const text = await Actions.getElementText(by.id(`right_value__${row}`))
      assert(
        text === rightVal,
        `Expected ${row} to have value ${rightVal}, but got "[${text}]"`
      )
    }
  }

  async verifySelectedAppearance(selectedAppearance: string) {
    await assertions.isVisible(by.id(`${selectedAppearance}_selected`))
  }

  async verifyUnselectedAppearance(unselectedAppearance: string) {
    await assertions.isVisible(by.id(`${unselectedAppearance}_unselected`))
  }

  async selectAppearance(appearance: string) {
    await Actions.tapElementAtIndex(by.id(`${appearance}_unselected`), 0)
  }

  async verifyAppearanceScreen(
    selectedAppearance: string,
    [...unselectedAppearances]: string[]
  ) {
    await Actions.waitForElement(this.appearanceTitle)
    await assertions.isVisible(this.system)
    await assertions.isVisible(this.light)
    await assertions.isVisible(this.dark)
    await this.verifySelectedAppearance(selectedAppearance)
    await this.verifyUnselectedAppearance(unselectedAppearances[0] ?? '')
    await this.verifyUnselectedAppearance(unselectedAppearances[1] ?? '')
  }

  async verifyShowRecoveryPhraseScreen() {
    await Actions.waitForElement(this.showRecoveryPhraseTitle, 5000)
    await assertions.isVisible(this.showRecoveryPhraseDescription)
    await assertions.isVisible(this.showRecoveryPhraseWarning)
    await assertions.isVisible(commonElsPage.copyPhrase)
  }

  async goSettings() {
    await Actions.tap(this.settingsBtn)
  }

  async verifyCurrencyScreen(curr = 'USD') {
    await Actions.waitForElement(this.selectCurrencyTitle)
    await assertions.isVisible(commonElsPage.searchBar)
    await assertions.isVisible(by.id(`selected_currency__${curr}`))
    await assertions.isVisible(by.text(curr))
  }

  async selectCurrency(curr: string) {
    await Actions.setInputText(commonElsPage.searchBar, curr)
    await Actions.tap(by.id(`currency__${curr}`))
  }

  async tapAddAccountBtn() {
    while (!(await Actions.isVisible(this.addAccountBtn, 0, 0))) {
      await Actions.swipe(this.accountList, 'left', 'fast', 0.5)
    }
    await Actions.tap(this.addAccountBtn)
  }

  async selectAccount(targetAccount: number) {
    // get the active account
    const accountName = await commonElsPage.getBalanceHeaderAccountName()
    const accountNum = parseInt(accountName?.slice(-1) || 'Wallet 1')

    // make direction to scroll to the left or right
    await this.goSettings()
    const direction = targetAccount > accountNum ? 'left' : 'right'

    // scroll till the target account is visible
    while (
      !(await Actions.isVisible(
        by.id(`${settings.accountNameIdPrefix}${targetAccount}`),
        0,
        0
      ))
    ) {
      await Actions.swipe(this.accountList, direction, 'fast', 0.5)
    }

    // tap the target account
    await Actions.tap(by.id(`${settings.accountNameIdPrefix}${targetAccount}`))
  }

  async verifyAccountBoxes(boxes = 0) {
    let index = 1

    while (index <= boxes) {
      console.log(`Testing account #${index}`)

      // verify the account box is visible
      if (
        await Actions.isVisible(
          by.id(`${settings.accountNameIdPrefix}${index}`),
          0,
          0
        )
      ) {
        index++
        continue
      }

      // Verify the account box is NOT visible when you hit the end of the list
      if (await Actions.isVisible(this.addAccountBtn, 0, 0)) {
        throw new Error(
          `Reached end of list, but ${settings.accountNameIdPrefix}${index} not found`
        )
      }

      // Scroll to the next box
      await Actions.swipe(this.accountList, 'left', 'slow', 0.5)
    }
  }

  async tapBiometrics(on = true) {
    await Actions.tap(on ? this.toggleBiometricsOn : this.toggleBiometricsOff)
  }

  async verifyNotificationsScreen(data: Record<string, string>) {
    await Actions.waitForElement(this.notificationsPreferences, 5000)
    for (const [title, subtitle] of Object.entries(data)) {
      await assertions.isVisible(by.id(`${title}_enabled_switch`))
      await assertions.isVisible(by.text(title))
      await assertions.isVisible(by.text(subtitle))
    }
  }

  async toggleAndVerify(isSwitchOn = 'enabled', notiType: string) {
    const toggled = isSwitchOn === 'enabled' ? 'disabled' : 'enabled'
    await this.tapNotificationSwitch(isSwitchOn, notiType)
    await Actions.waitForElement(by.id(`${notiType}_${toggled}_switch`))
  }

  async tapNotificationSwitch(isSwitchOn = 'enabled', notiType = 'Stake') {
    const switchTestID = `${notiType}_${isSwitchOn}_switch`
    await Actions.tap(by.id(switchTestID))
  }
}

export default new Settings()
