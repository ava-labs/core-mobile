import Actions from '../helpers/actions'
import Assert from '../helpers/assertions'
import { Platform } from '../helpers/constants'
import delay from '../helpers/waits'
import bridgeTab from '../locators/bridgeTab.loc'
import BottomTabsPage from '../pages/bottomTabs.page'
import PlusMenuPage from './plusMenu.page'
import PortfolioPage from './portfolio.page'

const platformIndex = Actions.platform() === Platform.iOS ? 1 : 0
const platformIndex2 = Actions.platform() === Platform.iOS ? 2 : 0

class BridgeTabPage {
  get amountToLowBtcAvaxMessage() {
    return by.text(bridgeTab.amountToLowBtcAvaxMessage)
  }

  get avalancheNetwork() {
    return by.text(bridgeTab.avalancheNetwork)
  }

  get avaxEthBridgeTransaction() {
    return by.text(bridgeTab.avaxEthBridgeTransaction)
  }

  get avaxBtcBridgeTransaction() {
    return by.text(bridgeTab.avaxBtcBridgeTransaction)
  }

  get btcToken() {
    return by.text(bridgeTab.btcToken)
  }

  get btcAvaxBridgeTransaction() {
    return by.text(bridgeTab.btcAvaxBridgeTransaction)
  }

  get bitcoinNetwork() {
    return by.text(bridgeTab.bitcoinNetwork)
  }

  get bridgeSuccessfulToastMsg() {
    return by.text(bridgeTab.bridgeSuccessfulToastMsg)
  }

  get completedStatusEth() {
    return by.text(bridgeTab.completedStatusEth)
  }

  get completedStatusAvax() {
    return by.text(bridgeTab.completedStatusAvax)
  }

  get completedStatusBtcAvaxMainnet() {
    return by.text(bridgeTab.completedStatusBtcAvaxMainnet)
  }

  get completedStatusBtcAvaxTestnet() {
    return by.text(bridgeTab.completedStatusBtcAvaxTestnet)
  }

  get confirmations() {
    return by.text(bridgeTab.confirmations)
  }

  get closebutton() {
    return by.text(bridgeTab.closebutton)
  }

  get ethereumNetwork() {
    return by.text(bridgeTab.ethereumNetwork)
  }

  get ethBridgeTransaction() {
    return by.text(bridgeTab.ethBridgeTransaction)
  }

  get fromText() {
    return by.text(bridgeTab.from)
  }

  get hide() {
    return by.text(bridgeTab.hide)
  }

  get inputTextField() {
    return by.id(bridgeTab.inputTextField)
  }

  get networkFee() {
    return by.text(bridgeTab.networkFee)
  }

  get sendingAmmount() {
    return by.text(bridgeTab.sendingAmmount)
  }

  get selectTokenDropdown() {
    return by.text(bridgeTab.selectTokenDropdown)
  }

  get toText() {
    return by.text(bridgeTab.to)
  }

  get transferButton() {
    return by.text(bridgeTab.transferButton)
  }

  get wrappedEtherToken() {
    return by.text(bridgeTab.wrappedEther)
  }

  get bridgeTitle() {
    return by.text(bridgeTab.bridgeTitle)
  }

  get bridgeBtn() {
    return by.id(bridgeTab.bridgeBtn)
  }

  get receive() {
    return by.text(bridgeTab.receive)
  }

  get bridgeToggleBtn() {
    return by.id(bridgeTab.bridgeToggleBtn)
  }

  get selectedToken() {
    return by.id(bridgeTab.selectedToken)
  }

  get toNetwork() {
    return by.id(bridgeTab.toNetwork)
  }

  get fromNetwork() {
    return by.id(bridgeTab.fromNetwork)
  }

  get error() {
    return by.id(bridgeTab.error)
  }

  get hollidayBannerTitle() {
    return by.text(bridgeTab.hollidayBannerTitle)
  }

  get hollidayBannerWebView() {
    return by.id(bridgeTab.hollidayBannerWebView)
  }

  get hollidayBannerContent() {
    return by.text(bridgeTab.hollidayBannerContent)
  }

  async tapBridgeBtn() {
    await delay(1000)
    await Actions.tap(this.bridgeBtn)
  }

  async tapBridgeToggleBtn() {
    await Actions.tap(this.bridgeToggleBtn)
  }

  async tapAvalancheNetwork() {
    await Actions.tapElementAtIndex(this.avalancheNetwork, platformIndex2)
  }

  async tapBitcoinNetwork() {
    await Actions.tapElementAtIndex(this.bitcoinNetwork, platformIndex)
  }

  async tapClose() {
    await Actions.tap(this.closebutton)
  }

  async tapBtcToken() {
    await Actions.tapElementAtIndex(this.btcToken, platformIndex)
  }

  async tapEthereumNetwork() {
    await Actions.tapElementAtIndex(this.ethereumNetwork, platformIndex)
  }

  async tapEthBridgeTransaction() {
    await Actions.tapElementAtIndex(this.ethBridgeTransaction, 0)
  }

  async tapHide() {
    await Actions.tapElementAtIndex(this.hide, 0)
  }

  async tapNetworkDropdown() {
    await Actions.tapElementAtIndex(this.avalancheNetwork, 0)
  }

  async tapSelectTokenDropdown() {
    await Actions.tapElementAtIndex(this.selectTokenDropdown, 0)
  }

  async tapWrappedEther() {
    await Actions.tapElementAtIndex(this.wrappedEtherToken, 0)
  }

  async tapTransferButton() {
    await Actions.tapElementAtIndexNoSync(this.transferButton, 0)
  }

  async inputTokenAmmountAvaxBtc() {
    await Actions.setInputText(
      this.inputTextField,
      bridgeTab.tokenValueAvaxBtc,
      0
    )
    await Actions.tap(this.fromText)
  }

  async inputTokenAmmountAvaxEth() {
    await Actions.setInputText(
      this.inputTextField,
      bridgeTab.tokenValueAvaxEth,
      0
    )
    await Actions.tap(this.fromText)
  }

  async inputTokenAmmountBtcAvax() {
    await Actions.setInputText(
      this.inputTextField,
      bridgeTab.tokenValueBtcAvax,
      0
    )
    await Actions.tap(this.fromText)
  }

  async inputTokenAmmountEthAvax() {
    await Actions.setInputText(
      this.inputTextField,
      bridgeTab.tokenValueEthAvax,
      0
    )
    await Actions.tap(this.fromText)
  }

  async tapFromtext() {
    await Actions.tap(this.fromText)
  }

  async switchToNetwork(network: string) {
    await BottomTabsPage.tapPlusIcon()
    await PlusMenuPage.tapBridgeButton()
    await this.tapNetworkDropdown()
    switch (network) {
      case 'Bitcoin':
        await this.tapBitcoinNetwork()
        break
      case 'Ethereum':
        await this.tapEthereumNetwork()
        break
      case 'Avalanche':
        await this.tapAvalancheNetwork()
        break
    }
  }

  async verifyBridgeItems(
    incomingNetwork: Detox.NativeMatcher,
    outgoingNetwork: Detox.NativeMatcher
  ) {
    await Assert.isVisibleNoSync(incomingNetwork)
    await Assert.isVisibleNoSync(outgoingNetwork)
    await Assert.isVisibleNoSync(this.sendingAmmount)
    await Assert.isVisibleNoSync(this.fromText)
    await Assert.isVisibleNoSync(this.networkFee)
    await Assert.isVisibleNoSync(this.confirmations)
    await Assert.isVisibleNoSync(this.toText)
  }

  async verifyBridgeScreen() {
    await Actions.waitForElement(this.bridgeTitle)
    await Assert.isVisible(this.bridgeBtn)
    await Assert.isVisible(this.fromText)
    await Assert.isVisible(this.receive)
    await Assert.isVisible(this.bridgeToggleBtn)
  }

  async tapFromNetwork() {
    await Actions.tap(this.fromNetwork)
  }

  async tapSelectToken() {
    await delay(1000)
    await Actions.tap(this.selectedToken)
  }

  async verifyFromNetwork(network: string) {
    await Assert.hasText(this.fromNetwork, network, 0)
  }

  async verifyNetworks(from: string, to: string) {
    await this.verifyFromNetwork(from)
    await this.verifyToNetwork(to)
  }

  async verifyToNetwork(network = '') {
    await Assert.isVisible(this.toNetwork)
    await Assert.hasText(this.toNetwork, network, 0)
  }
  // eslint-disable-next-line max-params
  async verifyBridgeTransaction(
    timeout: number,
    completedStatusIncomingNetwork: Detox.NativeMatcher,
    completedStatusOutgoingNetwork: Detox.NativeMatcher,
    successfullBridgeTransaction: Detox.NativeMatcher
  ) {
    await Actions.waitForElementNoSync(this.closebutton, timeout)
    await Assert.isVisible(completedStatusIncomingNetwork)
    await Assert.isVisible(completedStatusOutgoingNetwork)

    await this.tapClose()
    await PortfolioPage.tapAvaxNetwork()
    await PortfolioPage.tapActivityTab()
    await Assert.isVisible(successfullBridgeTransaction)
  }

  async goToBridge() {
    await BottomTabsPage.tapPlusIcon()
    await PlusMenuPage.tapBridgeButton()
  }

  async verifyHollidayBanner() {
    await Actions.waitForElement(this.hollidayBannerTitle)
    await Actions.waitForElement(this.hollidayBannerContent)
  }

  async tapHollidayBanner() {
    await Actions.tap(this.hollidayBannerTitle)
    await Actions.waitForElement(this.hollidayBannerWebView)
  }
}

export default new BridgeTabPage()
