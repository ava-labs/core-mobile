import { actions } from '../helpers/actions'
import settings from '../locators/settings.loc'
import { selectors } from '../helpers/selectors'
import commonElsLoc from '../locators/commonEls.loc'
import { Network, networks } from '../helpers/networks'
import common from './commonEls.page'
import onboardingPage from './onboarding.page'
import portfolioPage from './portfolio.page'
class Settings {
  get addWalletBtn() {
    return selectors.getById(settings.addWalletBtn)
  }

  get createNewAccountBtn() {
    return selectors.getById(settings.createNewAccountBtn)
  }

  get manageAccountsTitle() {
    return selectors.getByText(settings.manageAccountsTitle)
  }

  get importWalletBtn() {
    return selectors.getById(settings.importWalletBtn)
  }

  get importRecoveryPhraseBtn() {
    return selectors.getById(settings.importRecoveryPhraseBtn)
  }

  get importPrivateKeyBtn() {
    return selectors.getById(settings.importPrivateKeyBtn)
  }

  get manageAccountsBtn() {
    return selectors.getById(settings.manageAccountsBtn)
  }

  get settingsBtn() {
    return selectors.getById(settings.settingsBtn)
  }

  get accountList() {
    return selectors.getById(settings.accountList)
  }

  get settingsScrollView() {
    return selectors.getById(settings.settingsScrollView)
  }

  get settingsFooter() {
    return selectors.getById(settings.settingsFooter)
  }

  get networks() {
    return selectors.getBySomeText(settings.networks)
  }

  get addNetworkBtn() {
    return selectors.getById(settings.addNetworkBtn)
  }

  get nameContactBtn() {
    return selectors.getById(settings.nameContactBtn)
  }

  get nameThisNetworkBtn() {
    return selectors.getByText(settings.nameThisNetworkBtn)
  }

  get networkRpcUrl() {
    return selectors.getById(settings.networkRpcUrl)
  }

  get saveNetworkBtn() {
    return selectors.getById(settings.saveNetworkBtn)
  }

  get chainId() {
    return selectors.getById(settings.chainId)
  }

  get tokenSymbol() {
    return selectors.getById(settings.tokenSymbol)
  }

  get tokenName() {
    return selectors.getById(settings.tokenName)
  }

  get explorerUrl() {
    return selectors.getById(settings.explorerUrl)
  }

  get renameAccount() {
    return selectors.getByText(settings.renameAccount)
  }

  get removeAccount() {
    return selectors.getBySmartText(settings.removeAccount)
  }

  get rename() {
    return selectors.getByText(settings.rename)
  }

  get addAccountToThisWallet() {
    return selectors.getByText(settings.addAccountToThisWallet)
  }

  get removeWallet() {
    return selectors.getByText(settings.removeWallet)
  }

  get theme() {
    return selectors.getBySomeText(settings.theme)
  }

  get themeTitle() {
    return selectors.getBySomeText(settings.themeTitle)
  }

  get enterYourNewPinTitle() {
    return selectors.getBySomeText(settings.enterYourNewPinTitle)
  }

  get confirmYourNewPinTitle() {
    return selectors.getBySomeText(settings.confirmYourNewPinTitle)
  }

  get securityAndPrivacy() {
    return selectors.getBySomeText(settings.securityAndPrivacy)
  }

  get changePin() {
    return selectors.getByText(settings.changePin)
  }

  get enterYourCurrentPinTitle() {
    return selectors.getBySomeText(settings.enterYourCurrentPinTitle)
  }

  get testnetSwitchOff() {
    return selectors.getById(settings.testnetSwitchOff)
  }

  get testnetSwitchOn() {
    return selectors.getById(settings.testnetSwitchOn)
  }

  get testnetIsOn() {
    return selectors.getByText(settings.testnetModeOnToast)
  }

  get testnetAvatar() {
    return selectors.getById(settings.testnetAvatar)
  }

  get mainnetAvatar() {
    return selectors.getById(settings.mainnetAvatar)
  }

  get analyticsOn() {
    return selectors.getById(settings.analyticsOn)
  }

  get analyticsOff() {
    return selectors.getById(settings.analyticsOff)
  }

  get notificationsPreferences() {
    return selectors.getByText(settings.notificationsPreferences)
  }

  get notificationsPreferencesTitle() {
    return selectors.getBySomeText(settings.notificationsPreferencesTitle)
  }

  get currency() {
    return selectors.getByText(settings.currency)
  }

  get currencyId() {
    return selectors.getById(settings.currencyId)
  }

  get selectCurrencyTitle() {
    return selectors.getByText(settings.selectCurrencyTitle)
  }

  get showRecoveryPhrase() {
    return selectors.getByText(settings.showRecoveryPhrase)
  }

  get showRecoveryPhraseTitle() {
    return selectors.getBySomeText(settings.showRecoveryPhraseTitle)
  }

  get privateKeyWarning() {
    return selectors.getByText(settings.privateKeyWarning)
  }

  get privateKey() {
    return selectors.getById(settings.privateKey)
  }

  get copyKey() {
    return selectors.getByText(settings.copyKey)
  }

  get contacts() {
    return selectors.getBySomeText(settings.contacts)
  }

  get addAddressButton() {
    return selectors.getByText(settings.addAddressButton)
  }

  get typeInOrPasteAddress() {
    return selectors.getByText(settings.typeInOrPasteAddress)
  }

  get emptyContacts() {
    return selectors.getByText(settings.emptyContacts)
  }

  get customAvatar() {
    return selectors.getById(settings.customAvatar)
  }

  networkList(name: string) {
    return selectors.getById(`network_list__${name}`)
  }

  networkEnabled(name: string) {
    return selectors.getById(`network_toggle_enabled__${name}`)
  }

  networkDisabled(name: string) {
    return selectors.getById(`network_toggle_disabled__${name}`)
  }

  networkDetails(name: string) {
    return selectors.getById(`advanced_subtitle__${name}`)
  }

  networkName(name: string) {
    return selectors.getById(`network_name__${name}`)
  }

  manageAccountsWalletName(name: string) {
    return selectors.getById(`manage_accounts_wallet_name__${name}`)
  }

  manageAccountsAccountName(walletName = 'Wallet 1', accountName: string) {
    return selectors.getById(
      `manage_accounts_list__${walletName}__${accountName}`
    )
  }

  privateKeyAccount(accountName: string) {
    return selectors.getById(`private_key_account__${accountName}`)
  }

  get hkd() {
    return selectors.getByText(settings.hkd)
  }

  async verifyEmptyContacts() {
    await actions.waitFor(this.emptyContacts)
  }

  async editContactAddress(
    networkAndAddress: Record<string, string>,
    contactName: string
  ) {
    // add contact name
    await this.addContactName(contactName)
    // add contact addresses
    for (const [network, address] of Object.entries(networkAndAddress)) {
      await actions.click(selectors.getById(`contact_delete_btn__${network}`))
      await common.tapDeleteAlert()
      await actions.waitFor(selectors.getByText(`Add ${network} address`))
      await this.setAddress(network, address, contactName)
    }
    // exit the edit contact form
    await common.goBack()
  }

  async tapContactByName(contactName: string) {
    await actions.tap(selectors.getBySomeText(contactName))
  }

  async setAddress(network: string, address: string, contactName: string) {
    await actions.click(selectors.getByText(`Add ${network} address`))
    await actions.click(this.typeInOrPasteAddress)
    await actions.type(
      selectors.getById(`advanced_input__${network.toLowerCase()}`),
      address
    )
    await actions.tap(selectors.getByText(contactName))
  }

  async verifyContact(address: string, contactName: string) {
    const previewAddress = address.slice(0, 5)
    await actions.waitFor(selectors.getBySomeText(contactName))
    await actions.waitFor(selectors.getBySomeText(previewAddress))
  }

  async addContactAddress(
    networkAndAddress: Record<string, string>, // {evm: '0x6d...', solana: '1234'}
    contactName: string
  ) {
    // add contact name
    await this.addContactName(contactName)
    // add contact addresses
    for (const [network, address] of Object.entries(networkAndAddress)) {
      await this.setAddress(network, address, contactName)
    }
    // save contact
    await common.tapSave()
  }

  async tapAddAddressButton() {
    await actions.tap(this.addAddressButton)
  }

  async tapContacts() {
    await actions.tap(this.contacts)
  }

  async enterCurrentPin(pin = '000000') {
    await actions.waitFor(this.enterYourCurrentPinTitle)
    await onboardingPage.tapZero(pin)
  }

  async verifyShowPrivateKeyScreen(privateKey?: string) {
    await actions.waitFor(this.privateKeyWarning)
    await actions.isVisible(this.privateKey)
    await actions.isVisible(this.copyKey)

    if (privateKey) {
      await actions.verifyText(privateKey, this.privateKey)
    }
    await common.goBack()
  }

  async tapRemoveAccount() {
    await actions.click(this.removeAccount)
    await common.tapRemoveAlert()
  }

  async selectAccount(name: string, walletName = 'Wallet 1') {
    await actions.tap(this.manageAccountsAccountName(walletName, name))
  }

  async tapAddWalletBtn() {
    await actions.tap(this.addWalletBtn)
  }

  async addAccount(accountNum = 2, walletName = 'Wallet 1') {
    const accountName = `Account ${accountNum}`
    const ele = this.manageAccountsAccountName(walletName, accountName)
    while (!(await actions.getVisible(ele))) {
      await this.tapAddWalletBtn()
      await actions.tap(this.createNewAccountBtn)
      await actions.tap(this.manageAccountsTitle)
    }
  }

  async tapMoreIconByWallet(walletName = 'Wallet 1') {
    await actions.click(selectors.getById(`more_icon__${walletName}`))
  }

  async tapImportWalletBtn() {
    await actions.waitFor(this.importWalletBtn)
    await actions.tap(this.importWalletBtn)
  }

  async importWallet(mnemonic: string) {
    await this.tapManageAccountsBtn()
    await this.tapAddWalletBtn()
    await this.tapImportRecoveryPhraseBtn()
    await onboardingPage.enterRecoveryPhrase(mnemonic)
    await this.tapImportWalletBtn()
  }

  async importWalletViaPK(privateKey: string) {
    await this.tapManageAccountsBtn()
    await this.tapAddWalletBtn()
    await this.tapImportPrivateKeyBtn()
    await actions.pasteText(common.inputTextField, privateKey)
    await this.tapImportWalletBtn()
  }

  async verifyPKWalletImported(accountName = 'Account 3') {
    // verify the account on Manage Accounts screen
    await actions.waitFor(this.manageAccountsWalletName(settings.imported))
    await actions.isVisible(this.privateKeyAccount(accountName))

    // verify the account detail screen
    await this.goToAccountDetail(undefined, accountName)
    await this.verifyAccountDetail(undefined, accountName)
    await common.goBack()
  }

  async verifyPKWalletRemoved(accountName = 'Account 3') {
    await actions.isNotVisible(this.manageAccountsWalletName(settings.imported))
    await actions.isNotVisible(this.privateKeyAccount(accountName))
  }

  async verifyWalletImported(walletName = 'Wallet 2', accountCount = 3) {
    // verify the wallet name and account on Manage Accounts screen
    const accountName = `Account ${accountCount}`
    await actions.waitFor(this.manageAccountsWalletName(walletName))
    await actions.isVisible(
      this.manageAccountsAccountName(walletName, accountName)
    )
    // verify the account detail screen
    await this.goToAccountDetail(walletName, accountName)
    await this.verifyAccountDetail(walletName, accountName)
    await common.goBack()
  }

  async verifyAccountDetail(
    walletName: string | undefined,
    accountName: string
  ) {
    // verify the account name
    await common.verifyAccountName(accountName)
    if (walletName) {
      // if walletName is defined, it is a seed phrase imported wallet
      await actions.isVisible(selectors.getBySmartText(walletName))
      await actions.isVisible(selectors.getBySmartText(settings.primary))
    } else {
      // if walletName is undefined, it is a Private Key imported wallet
      await actions.isNotVisible(selectors.getBySmartText(settings.primary))
      await actions.isVisible(selectors.getBySmartText(settings.imported))
    }

    // verify the networks on the account detail screen
    for (const network of [
      commonElsLoc.evm,
      commonElsLoc.xpChain,
      commonElsLoc.solana,
      commonElsLoc.bitcoin
    ]) {
      await actions.isVisible(common.listItem(network))
    }

    // verify the rename and remove account buttons
    await actions.isVisible(this.renameAccount)
    await actions.isVisible(this.removeAccount)
  }

  async tapRename() {
    await actions.click(this.rename)
  }

  async tapAddAccountToThisWallet() {
    await actions.click(this.addAccountToThisWallet)
  }

  async tapRemoveWallet() {
    await actions.click(this.removeWallet)
    await common.tapRemoveAlert()
  }

  async addWalletViaPK(privateKey: string) {
    await this.tapAddWalletBtn()
    await this.tapImportPrivateKeyBtn()
    await common.enterTextInput(privateKey)
    await onboardingPage.tapImport()
  }

  async tapImportRecoveryPhraseBtn() {
    await actions.tap(this.importRecoveryPhraseBtn)
  }

  async tapImportPrivateKeyBtn() {
    await actions.tap(this.importPrivateKeyBtn)
  }

  async tapManageAccountsBtn() {
    while (!(await actions.getVisible(this.manageAccountsBtn))) {
      await actions.swipe('left', 0.5, this.accountList)
    }
    await actions.tap(this.manageAccountsBtn)
  }

  async verifyManageAccountsListItem(
    accountName: string,
    walletName = 'Wallet 1'
  ) {
    await actions.waitFor(
      this.manageAccountsAccountName(walletName, accountName)
    )
  }

  async goSettings() {
    await actions.delay(1500)
    await actions.click(this.settingsBtn)
    try {
      await actions.waitFor(common.grabber, 5000)
    } catch (e) {
      await actions.click(this.settingsBtn)
    }
  }

  async tapCurrency() {
    if (!(await actions.getVisible(this.currencyId))) {
      await this.swipeSettings()
    }
    await actions.tap(this.currencyId)
  }

  async verifyCurrencyScreen(curr = 'USD') {
    await actions.waitFor(this.selectCurrencyTitle)
    await actions.isVisible(selectors.getById(`selected_currency__${curr}`))
  }

  async tapNotifications() {
    if (!(await actions.getVisible(this.notificationsPreferences))) {
      await this.swipeSettings()
    }
    await actions.tap(this.notificationsPreferences)
  }

  async swipeSettings(amount = 0.8) {
    await actions.swipe('up', amount, this.mainnetAvatar)
  }

  async selectCurrency(curr: string) {
    await actions.tap(selectors.getById(`currency__${curr}`))
  }

  async tapShowRecoveryPhrase() {
    await actions.tap(this.showRecoveryPhrase)
  }

  async createNthAccount(
    account = 2,
    activeAccount = settings.account,
    walletName = 'Wallet 1'
  ) {
    await this.goSettings()
    await this.tapManageAccountsBtn()
    await this.addAccount(account, walletName)
    await this.selectAccount(activeAccount, walletName)
  }

  async tapNetworks() {
    await actions.tap(this.networks)
  }

  async tapAddNetworkBtn() {
    await actions.tap(this.addNetworkBtn)
  }

  async goNetworks() {
    await this.goSettings()
    await this.tapNetworks()
  }

  async verifyDefaultNetworks() {
    await actions.waitFor(this.addNetworkBtn)
    for (const network of networks) {
      await actions.isVisible(this.networkList(network.name))
      if (network.haveToggle) {
        await actions.isVisible(this.networkEnabled(network.name))
      } else {
        await actions.isNotVisible(this.networkEnabled(network.name))
        await actions.isNotVisible(this.networkDisabled(network.name))
      }
    }
  }

  async addContactName(name: string) {
    await actions.tap(this.nameContactBtn)
    await actions.type(common.dialogInput, name)
    await actions.tapEnterOnKeyboard()
    await common.tapSaveAlert()
  }

  async addNetworkName(name: string) {
    await actions.tap(this.nameThisNetworkBtn)
    await actions.type(common.dialogInput, name)
    await actions.tapEnterOnKeyboard()
    await common.tapSaveAlert()
  }

  async setNetworkData(type: string, value: string) {
    await actions.tap(selectors.getByText(`Add ${type}`))
    await actions.dragAndDrop(this.nameThisNetworkBtn, [0, -500])
    await actions.type(
      selectors.getById(`advanced_input__${type.toLowerCase()}`),
      value
    )
    try {
      await actions.tapEnterOnKeyboard()
    } catch (e) {
      await actions.dismissKeyboard(`advanced_input__${type.toLowerCase()}`)
    }
  }

  async addNetwork(network: Network) {
    const { name, data } = network
    await this.tapAddNetworkBtn()
    await this.setNetworkData('Network RPC URL', data?.rpcUrl ?? '')
    await this.setNetworkData('Chain ID', data?.chainId ?? '')
    await this.setNetworkData('token symbol', data?.tokenSymbol ?? '')
    await this.setNetworkData('token name', data?.tokenName ?? '')
    await this.addNetworkName(name)
    await this.tapSaveNetworkBtn()
  }

  async tapSaveNetworkBtn() {
    await actions.tap(this.saveNetworkBtn)
  }

  async editNetwork(networkName: string) {
    await this.addNetworkName(networkName)
    await this.tapSaveNetworkBtn()
  }

  async removeNetwork(networkName: string) {
    await this.tapNetworkByName(networkName)
    await common.tapDelete()
    await common.tapDeleteAlert()
  }

  async verifySettingsRow(row: string, rightVal: string | undefined) {
    await actions.waitFor(selectors.getById(`list_item__${row}`))

    if (rightVal) {
      await actions.isVisible(selectors.getById(`right_value__${rightVal}`))
    }
  }

  async verifyNetworkRow(
    networkName: string,
    hasToggle = false,
    isEnabled = false
  ) {
    if (
      !(await actions.getVisible(
        selectors.getById(`network_list__${networkName}`)
      ))
    ) {
      await actions.swipe('up', 0.2, this.networks)
    }
    await actions.waitFor(selectors.getById(`network_list__${networkName}`))
    if (hasToggle) {
      const toggle = isEnabled ? 'enabled' : 'disabled'
      await actions.isVisible(
        selectors.getById(`network_toggle_${toggle}__${networkName}`)
      )
    } else {
      await actions.isNotVisible(
        selectors.getById(`network_toggle_enabled__${networkName}`)
      )
      await actions.isNotVisible(
        selectors.getById(`network_toggle_disabled__${networkName}`)
      )
    }
  }

  async tapNetworkByName(networkName: string) {
    try {
      await actions.tap(this.networkList(networkName))
    } catch (e) {
      await common.typeSearchBar(networkName)
      await actions.tap(this.networkList(networkName))
    }
  }

  async verifyNetworkDetails(network: Network) {
    await this.tapNetworkByName(network.name)
    await actions.waitFor(this.networkName(network.name))
    if (![commonElsLoc.bitcoin, commonElsLoc.solana].includes(network.name)) {
      await actions.isVisible(this.networkRpcUrl)
      await actions.isVisible(this.networkDetails(network.data?.rpcUrl ?? ''))
    }

    if (network.data?.explorerUrl) {
      await actions.isVisible(this.networkDetails(network.data?.explorerUrl))
    }

    await actions.isVisible(this.networkDetails(network.data?.chainId ?? ''))
    await actions.isVisible(
      this.networkDetails(network.data?.tokenSymbol ?? '')
    )
    await actions.isVisible(this.networkDetails(network.data?.tokenName ?? ''))
    await common.goBack()
  }

  async tapNetworkSwitch(networkName: string, isEnabled = true) {
    const toggle = isEnabled ? 'enabled' : 'disabled'
    const networkPrefix = `network_toggle_${toggle}__${networkName}`
    await actions.longPress(selectors.getById(networkPrefix))
  }

  async tapNetworkSwitches(isEnabled = true) {
    for (const { name, haveToggle } of networks) {
      if (haveToggle) await this.tapNetworkSwitch(name, isEnabled)
    }
  }

  async goToAccountDetail(
    walletName: string | undefined = undefined,
    accountName: string
  ) {
    const targetId = walletName
      ? `${settings.accountDetailIconIdPrefix}${walletName}_${accountName}`
      : `${settings.accountDetailIconIdPrefix}${accountName}`

    await actions.tap(selectors.getById(targetId))
  }

  async tapShowPrivateKey() {
    await actions.tap(common.listItem(settings.showPrivateKey))
  }

  async tapRenameAccount() {
    await actions.tap(this.renameAccount)
  }

  async setNewAccountName(newAccountName: string) {
    await actions.type(common.dialogInput, newAccountName)
    try {
      await actions.click(common.save)
    } catch (e) {
      await actions.tap(common.saveUpperCase)
    }
  }

  async verifyAccountCarouselItem(accountName: string) {
    await actions.waitFor(
      selectors.getById(`${settings.accountCarouselItemIdPrefix}${accountName}`)
    )
  }

  async switchAccountByCarousel(accountName: string) {
    await actions.tap(
      selectors.getById(`${settings.accountCarouselItemIdPrefix}${accountName}`)
    )
  }

  async switchAccount(name = settings.account) {
    await this.goSettings()
    await this.switchAccountByCarousel(name)
  }

  async tapTheme(needSwipe = true) {
    if (needSwipe) {
      await this.swipeSettings()
    }
    await actions.tap(this.theme)
  }

  async verifyTheme(
    selectedAppearance: string,
    [...unselectedAppearances]: string[]
  ) {
    await actions.waitFor(this.themeTitle)
    await this.verifySelectedAppearance(selectedAppearance)
    await this.verifyUnselectedAppearance(unselectedAppearances[0] ?? '')
    await this.verifyUnselectedAppearance(unselectedAppearances[1] ?? '')
  }

  async verifySelectedAppearance(selectedAppearance: string) {
    await actions.isVisible(selectors.getById(`${selectedAppearance}_selected`))
  }

  async verifyUnselectedAppearance(unselectedAppearance: string) {
    await actions.isVisible(
      selectors.getById(`${unselectedAppearance}_unselected`)
    )
  }

  async selectTheme(appearance: string) {
    await actions.tap(selectors.getById(`${appearance}_unselected`))
  }

  async tapSecurityAndPrivacy(needSwipe = true) {
    if (needSwipe) {
      await this.swipeSettings()
    }
    await actions.tap(this.securityAndPrivacy)
  }

  async tapChangePin() {
    await actions.tap(this.changePin)
  }

  async setNewPin(newPin = '111111') {
    await actions.waitFor(this.enterYourNewPinTitle)
    await onboardingPage.tapZero(newPin)
    await actions.waitFor(this.confirmYourNewPinTitle)
    await onboardingPage.tapZero(newPin)
  }

  async switchToTestnet() {
    try {
      await actions.isNotVisible(portfolioPage.testnetModeIsOn)
      await this.goSettings()
      await actions.longPress(this.testnetSwitchOff)
      return true
    } catch (e) {
      console.log('You are on testnet')
      return false
    }
  }

  async switchToMainnet() {
    try {
      await actions.isVisible(portfolioPage.testnetModeIsOn)
      await this.goSettings()
      await actions.longPress(this.testnetSwitchOn)
      return true
    } catch (e) {
      console.log('You are on mainnet')
      return false
    }
  }

  async verifyTestnetMode() {
    await actions.waitFor(this.testnetSwitchOn)
    await actions.isVisible(this.testnetAvatar)
    await actions.waitForNotVisible(this.testnetIsOn)
    await common.dismissBottomSheet()
    await common.pullToRefresh()
    await actions.waitFor(portfolioPage.testnetModeIsOn, 40000)
  }

  async verifyMainnetMode() {
    await actions.waitFor(this.testnetSwitchOff)
    await actions.isVisible(this.mainnetAvatar)
    await common.dismissBottomSheet()
    await actions.isNotVisible(portfolioPage.testnetModeIsOn)
  }

  async verifyAnalyticsSwitch(isOn = true) {
    if (isOn) {
      await actions.waitFor(this.analyticsOn)
    } else {
      await actions.waitFor(this.analyticsOff)
    }
  }

  async tapAnalyticsSwitch(isOn = true) {
    if (isOn) {
      await actions.longPress(this.analyticsOn)
    } else {
      await actions.longPress(this.analyticsOff)
    }
  }

  async verifyNotificationsScreen(data: Record<string, string>) {
    await actions.waitFor(this.notificationsPreferencesTitle)
    for (const [title] of Object.entries(data)) {
      await actions.isVisible(selectors.getById(`${title}_enabled_switch`))
    }
  }

  async tapNotificationSwitch(isSwitchOn = 'enabled', notiType = 'Stake') {
    const switchTestID = `${notiType}_${isSwitchOn}_switch`
    await actions.longPress(selectors.getById(switchTestID))
  }

  async toggleAndVerify(isSwitchOn = 'enabled', notiType: string) {
    const toggled = isSwitchOn === 'enabled' ? 'disabled' : 'enabled'
    await this.tapNotificationSwitch(isSwitchOn, notiType)
    await actions.isVisible(selectors.getById(`${notiType}_${toggled}_switch`))
  }
}

export default new Settings()
