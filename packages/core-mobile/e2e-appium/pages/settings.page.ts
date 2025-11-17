/* eslint-disable max-params */
import { actions } from '../helpers/actions'
import settings from '../locators/settings.loc'
import { selectors } from '../helpers/selectors'
import commonElsLoc from '../locators/commonEls.loc'
import { Network, networks } from '../helpers/networks'
import common from './commonEls.page'
import onboardingPage from './onboarding.page'
import portfolioPage from './portfolio.page'
import commonElsPage from './commonEls.page'

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

  get networkRpcUrl() {
    return selectors.getById(settings.networkRpcUrl)
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

  get theme() {
    return selectors.getBySomeText(settings.theme)
  }

  get themeTitle() {
    return selectors.getByText(settings.themeTitle)
  }

  get enterYourNewPinTitle() {
    return selectors.getByText(settings.enterYourNewPinTitle)
  }

  get confirmYourNewPinTitle() {
    return selectors.getByText(settings.confirmYourNewPinTitle)
  }

  get securityAndPrivacy() {
    return selectors.getByText(settings.securityAndPrivacy)
  }

  get changePin() {
    return selectors.getByText(settings.changePin)
  }

  get enterYourCurrentPinTitle() {
    return selectors.getByText(settings.enterYourCurrentPinTitle)
  }

  get testnetSwitchOff() {
    return selectors.getById(settings.testnetSwitchOff)
  }

  get testnetSwitchOn() {
    return selectors.getById(settings.testnetSwitchOn)
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
    return selectors.getByText(settings.notificationsPreferencesTitle)
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
    return selectors.getByText(settings.showRecoveryPhraseTitle)
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
    await this.addContactOrNetworkName(contactName)
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
    await this.addContactOrNetworkName(contactName)
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

  async selectAccount(name: string) {
    await actions.tap(selectors.getById(`manage_accounts_list__${name}`))
  }

  async tapAddWalletBtn() {
    await actions.tap(this.addWalletBtn)
  }

  async addAccount(accountNum = 2) {
    const ele = selectors.getById(`manage_accounts_list__Account ${accountNum}`)
    while (!(await actions.getVisible(ele))) {
      await this.tapAddWalletBtn()
      await actions.tap(this.createNewAccountBtn)
      await actions.tap(this.manageAccountsTitle)
    }
  }

  async tapManageAccountsBtn() {
    while (!(await actions.getVisible(this.manageAccountsBtn))) {
      await actions.swipe('left', 0.5, this.accountList)
    }
    await actions.tap(this.manageAccountsBtn)
  }

  async verifyManageAccountsListItem(accountName: string) {
    await actions.waitFor(
      selectors.getById(`manage_accounts_list__${accountName}`)
    )
  }

  async goSettings() {
    await actions.delay(1500)
    await actions.click(this.settingsBtn)
    try {
      await actions.waitFor(commonElsPage.grabber)
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

  async createNthAccount(account = 2, activeAccount = settings.account) {
    await this.goSettings()
    await this.tapManageAccountsBtn()
    await this.addAccount(account)
    await this.selectAccount(activeAccount)
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

  async addContactOrNetworkName(name: string) {
    await actions.tap(this.nameContactBtn)
    await actions.type(common.dialogInput, name)
    await actions.tapEnterOnKeyboard()
    await common.tapSaveAlert()
  }

  async setNetworkData(type: string, value: string) {
    await actions.tap(selectors.getByText(`Add ${type}`))
    await actions.type(
      selectors.getById(`advanced_input__${type.toLowerCase()}`),
      value
    )
    await actions.dismissKeyboard()
  }

  async addNetwork(
    networkName: string,
    rpcUrl: string,
    chainId: string,
    nativeTokenSymbol: string,
    nativeTokenName: string
  ) {
    await this.tapAddNetworkBtn()
    await this.addContactOrNetworkName(networkName)
    await this.setNetworkData('Network RPC URL', rpcUrl)
    await this.setNetworkData('Chain ID', chainId)
    await this.setNetworkData('token symbol', nativeTokenSymbol)
    await this.setNetworkData('token name', nativeTokenName)
    await common.tapSave()
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
    await actions.isVisible(
      this.networkDetails(network.data?.explorerUrl ?? '')
    )
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
    accountName: string,
    walletName: string | undefined = undefined
  ) {
    const targetId = walletName
      ? `${settings.accountDetailIconIdPrefix}${walletName}_${accountName}`
      : `${settings.accountDetailIconIdPrefix}${accountName}`

    await actions.tap(selectors.getById(targetId))
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
    await common.dismissBottomSheet()
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
