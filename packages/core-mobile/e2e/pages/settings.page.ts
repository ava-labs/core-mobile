import assert from 'assert'
import Actions from '../helpers/actions'
import assertions from '../helpers/assertions'
import settings from '../locators/settings.loc'
import commonElsLoc from '../locators/commonEls.loc'
import delay from '../helpers/waits'
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

  get contacts() {
    return by.text(settings.contacts)
  }

  get currency() {
    return by.text(settings.currency)
  }

  get networks() {
    return by.text(settings.networks)
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

  get addWalletBtn() {
    return by.id(settings.addWalletBtn)
  }

  get createNewAccountBtn() {
    return by.id(settings.createNewAccountBtn)
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

  get renameAccount() {
    return by.text(settings.renameAccount)
  }

  get manageAccountsBtn() {
    return by.id(settings.manageAccountsBtn)
  }

  get emptyContacts() {
    return by.text(settings.emptyContacts)
  }

  get emptyContactsText() {
    return by.text(settings.emptyContactsText)
  }

  get addAddressButton() {
    return by.text(settings.addAddressButton)
  }

  get nameContactBtn() {
    return by.id(settings.nameContactBtn)
  }

  get typeInOrPasteAddress() {
    return by.text(settings.typeInOrPasteAddress)
  }

  get contactAddressInput() {
    return by.id(settings.contactAddressInput)
  }

  get contactPreviewAddress() {
    return by.id(settings.contactPreviewAddress)
  }

  async tapAdvanced() {
    await Actions.tapElementAtIndex(this.advanced, 0)
  }

  async tapContacts() {
    await Actions.tapElementAtIndex(this.contacts, 0)
  }

  async tapNotifications() {
    await this.scrollToSettingsFooter()
    await Actions.tapElementAtIndex(this.notificationsPreferences, 0)
  }

  async tapCurrencyRow() {
    await Actions.tapElementAtIndex(this.currency, 0)
  }

  async tapNetworksRow() {
    await Actions.tapElementAtIndex(this.networks, 0)
  }

  async scrollToSettingsFooter() {
    const isVisible = await Actions.isVisible(this.securityAndPrivacy)
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
    try {
      await assertions.isNotVisible(portfolioPage.testnetModeIsOn)
      await this.goSettings()
      await Actions.longPress(this.testnetSwitchOff)
      return true
    } catch (e) {
      console.log('You are on testnet')
      return false
    }
  }

  async switchToMainnet() {
    try {
      await assertions.isVisible(portfolioPage.testnetModeIsOn)
      await this.goSettings()
      await Actions.longPress(this.testnetSwitchOn)
      return true
    } catch (e) {
      console.log('You are on mainnet')
      return false
    }
  }

  async verifyCurrencyScreen(curr = 'USD') {
    await Actions.waitForElement(this.selectCurrencyTitle)
    await assertions.isVisible(commonElsPage.searchBar)
    await assertions.isVisible(by.id(`selected_currency__${curr}`))
    await assertions.isVisible(by.text(curr))
  }

  async verifyAccountCarouselItem(accountName: string) {
    await Actions.waitForElement(
      by.id(`${settings.accountCarouselItemIdPrefix}${accountName}`)
    )
  }

  async switchAccountByCarousel(accountName: string) {
    await Actions.tap(
      by.id(`${settings.accountCarouselItemIdPrefix}${accountName}`)
    )
  }

  async selectCurrency(curr: string) {
    await Actions.setInputText(commonElsPage.searchBar, curr)
    await Actions.tap(by.id(`currency__${curr}`))
  }

  async tapManageAccountsBtn() {
    await Actions.waitForElement(this.settingsScrollView, 10000)
    while (!(await Actions.isVisible(this.manageAccountsBtn, 0, 0))) {
      await Actions.swipe(this.accountList, 'left', 'fast', 0.5)
      await Actions.waitForElement(this.manageAccountsBtn, 1000)
    }
    await Actions.tap(this.manageAccountsBtn)
  }

  async tapAddWalletBtn() {
    await Actions.tap(this.addWalletBtn)
  }

  async addAccount(accountNum = 2) {
    while (
      !(await Actions.isVisible(
        by.id(`manage_accounts_list__Account ${accountNum}`),
        0,
        5000
      ))
    ) {
      await this.tapAddWalletBtn()
      await Actions.waitForElement(this.createNewAccountBtn)
      await Actions.tap(this.createNewAccountBtn)
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

  async goToAccountDetail(
    accountName: string,
    walletName: string | undefined = undefined
  ) {
    const targetId = walletName
      ? `${settings.accountDetailIconIdPrefix}${walletName}_${accountName}`
      : `${settings.accountDetailIconIdPrefix}${accountName}`

    await Actions.tap(by.id(targetId))
  }

  async verifyMangeAccountsScreen(walletName: string, accountName: string) {
    await Actions.waitForElement(by.id(`manage_accounts_list__${accountName}`))
    await Actions.waitForElement(
      by.id(`manage_accounts_wallet_name__${walletName}`)
    )
  }

  async verifyAccountDetail(portfolioAccountName: string) {
    // Copy address verification
    await this.verifyAddressCopied(commonElsLoc.evm)
    await this.verifyAddressCopied(commonElsLoc.xpChain)
    await this.verifyAddressCopied(commonElsLoc.solana)
    await this.verifyAddressCopied(commonElsLoc.bitcoin)

    // Account name verification
    await Actions.waitForElement(commonElsPage.evm)
    await commonElsPage.verifyAccountName(portfolioAccountName, 1)

    // Wallet address section verification
    await assertions.isVisible(commonElsPage.xpChain)
    await assertions.isVisible(commonElsPage.bitcoin)
    await assertions.isVisible(commonElsPage.solana)
  }

  async verifyAddressCopied(network: string) {
    await Actions.tap(by.id(commonElsLoc.copyBtn + network))
    await assertions.isVisible(by.text(network + settings.addressCopied))
  }

  async tapRenameAccount() {
    await Actions.tap(this.renameAccount)
  }

  async setNewAccountName(newAccountName: string) {
    await commonElsPage.typeSearchBar(newAccountName, commonElsPage.dialogInput)
    await commonElsPage.tapSave()
    await delay(500)
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
    await this.goSettings()
    await this.switchAccountByCarousel(name)
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

  async enableNetwork(network = commonElsLoc.xChain) {
    await this.goSettings()
    await this.tapNetworksRow()
    await Actions.setInputText(commonElsPage.searchBar, network)
    try {
      await Actions.longPress(by.id(`network_toggle_disabled__${network}`))
    } catch (e) {
      console.log(`Already enabled ${network}`)
    }
    await commonElsPage.dismissBottomSheet()
  }

  async verifyEmptyContactsScreen() {
    await Actions.waitForElement(this.emptyContacts)
    await assertions.isVisible(this.emptyContactsText)
    await assertions.isVisible(this.addAddressButton)
  }

  async tapAddAddressButton() {
    await Actions.tapElementAtIndex(this.addAddressButton, 0)
  }

  async addContactName(name: string) {
    await Actions.tapElementAtIndex(this.nameContactBtn, 0)
    await commonElsPage.typeSearchBar(name, commonElsPage.dialogInput)
    await delay(5000)
    await commonElsPage.tapSave()
  }

  async addContactAddress(
    networkAndAddress: Record<string, string>, // {evm: '0x6d...', solana: '1234'}
    contactName: string
  ) {
    // add contact name
    await this.addContactName(contactName)

    // add contact addresses
    for (const [network, address] of Object.entries(networkAndAddress)) {
      await this.setAddress(network, address)
    }

    // save contact
    await commonElsPage.tapSave()
  }

  async setAddress(network: string, address: string) {
    await Actions.tap(by.text(`Add ${network} address`))
    await Actions.tap(this.typeInOrPasteAddress)
    await Actions.setInputText(by.id(`contact_input__${network}`), address)
    await Actions.dismissKeyboard(`contact_input__${network}`)
  }

  async editContactAddress(
    networkAndAddress: Record<string, string>,
    contactName: string | undefined = undefined
  ) {
    // add contact name
    if (contactName) {
      await this.addContactName(contactName)
    }

    // add contact addresses
    for (const [network, address] of Object.entries(networkAndAddress)) {
      await Actions.tap(by.id(`contact_delete_btn__${network}`))
      await commonElsPage.tapDelete()
      await Actions.waitForElement(by.text(`Add ${network} address`))
      await this.setAddress(network, address)
    }

    // exit the edit contact form
    await commonElsPage.goBack()
  }

  async verifyContact(address: string, contactName: string) {
    const previewAddress = address.slice(0, 5)
    await Actions.waitForElement(by.text(contactName))
    await assertions.isVisible(by.text(contactName))
    await assertions.hasPartialText(this.contactPreviewAddress, previewAddress)
  }

  async tapContactByName(contactName: string) {
    await Actions.tapElementAtIndex(by.text(contactName), 0)
  }
}

export default new Settings()
