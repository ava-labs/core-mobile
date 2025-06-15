import assert from 'assert'
import Actions from '../helpers/actions'
import assertions from '../helpers/assertions'
import settings from '../locators/settings.loc'
import commonElsPage from './commonEls.page'
import portfolioPage from './portfolio.page'

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

  get notificationsPreferencesTitle() {
    return by.text(settings.notificationsPreferencesTitle)
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

  get testnetSwitchOff() {
    return by.id(settings.testnetSwitchOff)
  }

  get testnetSwitchOn() {
    return by.id(settings.testnetSwitchOn)
  }

  get testnetModeToast() {
    return by.id(settings.testnetModeToast)
  }

  get testnetModeOffToast() {
    return by.text(settings.testnetModeOffToast)
  }

  get fujiFunds() {
    return by.text(settings.fujiFunds)
  }

  get totalNetWorth() {
    return by.text(settings.totalNetWorth)
  }

  get mainnetAvatar() {
    return by.id(settings.mainnetAvatar)
  }

  get testnetAvatar() {
    return by.id(settings.testnetAvatar)
  }

  get cChainAddressCopyBtn() {
    return by.id(settings.cChainAddressCopyBtn)
  }

  get pChainAddressCopyBtn() {
    return by.id(settings.pChainAddressCopyBtn)
  }

  get xChainAddressCopyBtn() {
    return by.id(settings.xChainAddressCopyBtn)
  }

  get ethAddressCopyBtn() {
    return by.id(settings.ethAddressCopyBtn)
  }

  get btcAddressCopyBtn() {
    return by.id(settings.btcAddressCopyBtn)
  }

  get cChainAddressCopyToast() {
    return by.text(settings.cChainAddressCopyToast)
  }

  get pChainAddressCopyToast() {
    return by.text(settings.pChainAddressCopyToast)
  }

  get xChainAddressCopyToast() {
    return by.text(settings.xChainAddressCopyToast)
  }

  get ethAddressCopyToast() {
    return by.text(settings.ethAddressCopyToast)
  }

  get btcAddressCopyToast() {
    return by.text(settings.btcAddressCopyToast)
  }

  get renameAccount() {
    return by.text(settings.renameAccount)
  }

  get manageAccountsBtn() {
    return by.id(settings.manageAccountsBtn)
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
      await Actions.longPress(this.analyticsOn)
    } else {
      await Actions.longPress(this.analyticsOff)
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

  async switchToTestnet() {
    await Actions.longPress(this.testnetSwitchOff)
  }

  async switchToMainnet() {
    await Actions.longPress(this.testnetSwitchOn)
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

  async tapManageAccountsBtn() {
    while (!(await Actions.isVisible(this.manageAccountsBtn, 0, 0))) {
      await Actions.swipe(this.accountList, 'left', 'fast', 0.5)
    }
    await Actions.tap(this.manageAccountsBtn)
  }

  async addAccount(accountNum = 2) {
    await Actions.waitForElement(this.addAccountBtn)
    while (!(await Actions.isVisible(by.text(`Account ${accountNum}`), 0, 0))) {
      await Actions.tap(this.addAccountBtn)
    }
  }

  async tapBiometrics(on = true) {
    await Actions.tap(on ? this.toggleBiometricsOn : this.toggleBiometricsOff)
  }

  async verifyNotificationsScreen(data: Record<string, string>) {
    await Actions.waitForElement(this.notificationsPreferencesTitle)
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
    await commonElsPage.goBack()
    await this.tapNotifications()
    await Actions.waitForElement(by.id(`${notiType}_${toggled}_switch`))
  }

  async tapNotificationSwitch(isSwitchOn = 'enabled', notiType = 'Stake') {
    const switchTestID = `${notiType}_${isSwitchOn}_switch`
    await Actions.tap(by.id(switchTestID))
  }

  async verifyTestnetMode() {
    await Actions.waitForElement(this.testnetSwitchOn)
    await assertions.isVisible(this.fujiFunds)
    await assertions.isVisible(this.testnetAvatar)
    await commonElsPage.dismissBottomSheet()
    await assertions.isVisible(portfolioPage.testnetModeIsOn)
  }

  async verifyMainnetMode() {
    await Actions.waitForElement(this.testnetSwitchOff)
    await assertions.isNotVisible(this.fujiFunds)
    await assertions.isVisible(this.totalNetWorth)
    await assertions.isVisible(this.mainnetAvatar)
    await commonElsPage.dismissBottomSheet()
    await assertions.isNotVisible(portfolioPage.testnetModeIsOn)
  }

  async goToAccountDetail(accountNum: number) {
    await Actions.tap(
      by.id(`${settings.accountDetailIconIdPrefix}${accountNum}`)
    )
  }

  async verifyAccountDetail(portfolioAccountName: string) {
    // Account name verification
    await Actions.waitForElement(commonElsPage.cChain)
    await commonElsPage.verifyAccountName(portfolioAccountName, 1)

    // Wallet address section verification
    await assertions.isVisible(commonElsPage.pChain)
    await assertions.isVisible(commonElsPage.xChain)
    await assertions.isVisible(commonElsPage.ethereum)
    await assertions.isVisible(commonElsPage.bitcoin)

    // Copy address verification
    await Actions.tap(this.cChainAddressCopyBtn)
    await assertions.isVisible(this.cChainAddressCopyToast)
    await Actions.tap(this.pChainAddressCopyBtn)
    await assertions.isVisible(this.pChainAddressCopyToast)
    await Actions.tap(this.xChainAddressCopyBtn)
    await assertions.isVisible(this.xChainAddressCopyToast)
    await Actions.tap(this.ethAddressCopyBtn)
    await assertions.isVisible(this.ethAddressCopyToast)
    await Actions.tap(this.btcAddressCopyBtn)
    await assertions.isVisible(this.btcAddressCopyToast)

    // Wallet info verification is NOT done yet and let's revisit it once it's done
  }

  async tapRenameAccount() {
    await Actions.tap(this.renameAccount)
  }

  async setNewAccountName(newAccountName: string) {
    await commonElsPage.typeSearchBar(newAccountName, commonElsPage.dialogInput)
    await commonElsPage.tapSave()
  }

  async createNthAccount(account = 2, activeAccount = settings.account) {
    await this.goSettings()
    await this.tapManageAccountsBtn()
    await this.addAccount(account)
    await this.selectAccount(activeAccount)
    await commonElsPage.dismissBottomSheet()
  }

  async selectAccount(name: string) {
    await Actions.tap(by.id(`manage_accounts_list__${name}`))
  }

  async switchAccount(name = settings.account) {
    // You switch account within the `manage accounts` screen
    // settings > manage all or add a wallet > select the account
    await this.goSettings()
    await this.tapManageAccountsBtn()
    await this.selectAccount(name)
    await commonElsPage.dismissBottomSheet()
  }

  async quickSwitchAccount(name = settings.account) {
    // You switch account on Settings view without entering the `manage accounts` screen
    // settings > tap the account on the account carousel
    await this.goSettings()
    const ele = by.id(`account_carousel_item__${name}`)
    while (!(await Actions.isVisible(ele, 0, 0))) {
      await Actions.swipe(this.accountList, 'left', 'fast', 0.5)
    }
    await Actions.tap(ele)
    await commonElsPage.dismissBottomSheet()
  }
}

export default new Settings()
