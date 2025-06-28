import Action from '../helpers/actions'
import Assert from '../helpers/assertions'
import networksManage from '../locators/networksManage.loc'
import { Platform } from '../helpers/constants'
import portfolioLoc from '../locators/portfolio.loc'
import commonElsLoc from '../locators/commonEls.loc'
import PortfolioPage from './portfolio.page'
import commonElsPage from './commonEls.page'

const platformIndex = Action.platform() === Platform.iOS ? 1 : 0

class NetworksPage {
  get addNetwork() {
    return by.id(networksManage.addNetwork)
  }

  get chainID() {
    return by.id(networksManage.chainID)
  }

  get dropdown() {
    return by.id(networksManage.dropdown)
  }

  get deleteNetwork() {
    return by.text(networksManage.deleteNetwork)
  }

  get editNetwork() {
    return by.text(networksManage.editNetwork)
  }

  get ethereumSepoliaNetwork() {
    return by.text(networksManage.ethereumSepoliaNetwork)
  }

  get bitcoinTestnetNetwork() {
    return by.text(networksManage.bitcoinTestnetNetwork)
  }

  get ethTokenOnCustomNetwork() {
    return by.text(networksManage.ethTokenOnCustomNetwork)
  }

  get arbCustomNativeTokenSymbol() {
    return by.text(networksManage.arbCustomNativeTokenSymbol)
  }

  get explorerUrl() {
    return by.id(networksManage.explorerUrl)
  }

  get favoriteNetwork() {
    return by.id(networksManage.favoriteNetwork)
  }

  get favoritesTab() {
    return by.text(networksManage.favoritesTab)
  }

  get inputTextField() {
    return by.id(networksManage.inputTextField)
  }

  get nativeTokenSymbol() {
    return by.id(networksManage.nativeTokenSymbol)
  }

  get networksTab() {
    return by.text(networksManage.networksTab)
  }

  get networkRpcUrl() {
    return by.id(networksManage.networkRpcUrl)
  }

  get networkRpcUrlText() {
    return by.text(networksManage.networkRPCUrlText)
  }

  get networkTokenSymbol() {
    return by.text(networksManage.networkTokenSymbol)
  }

  get networkTokenNameText() {
    return by.text(networksManage.networkTokenNameText)
  }

  get celoWrongNetworkName() {
    return by.text(networksManage.celoWrongNetworkName)
  }

  get celoNetworkName() {
    return by.text(networksManage.celoNetworkName)
  }

  get customTab() {
    return by.text(networksManage.customTab)
  }

  get polygonCustomNetwork() {
    return by.text(networksManage.polygonCustomNetworkName)
  }

  get saveButton() {
    return by.id(networksManage.saveButton)
  }

  get arbCustomNetwork() {
    return by.text(networksManage.arbCustomNetworkName)
  }

  get networkName() {
    return by.id(networksManage.networkName)
  }

  get networkNotAvailableToast() {
    return by.id(networksManage.networkNotAvailableToast)
  }

  get bitcoin() {
    return by.text(networksManage.bitcoin)
  }

  get starSvg() {
    return by.id(networksManage.starSvg)
  }

  get chainIdText() {
    return by.text(networksManage.chainIdText)
  }

  get explorerUrlText() {
    return by.text(networksManage.explorerUrlText)
  }

  get connect() {
    return by.text(networksManage.connect)
  }

  async tapStarSvgByIndex(index: number) {
    await Action.tapElementAtIndex(this.starSvg, index)
  }

  async tapStarSvgByNetwork(network: string, isKeyboardUp = true) {
    if (isKeyboardUp && Action.platform() === 'ios') {
      await Action.dismissKeyboard(commonElsLoc.searchBar)
    }
    await Action.waitForElement(by.id(`star_svg__${network}`))
    await Action.tap(by.id(`star_svg__${network}`))
  }

  async tapBitcoin() {
    await Action.tapElementAtIndex(this.bitcoin, 0)
  }

  async tapAddNetwork() {
    await Action.tapElementAtIndex(this.addNetwork, 0)
  }

  async tapEthereumSepoliaNetwork(index = 0) {
    await Action.tapElementAtIndex(this.ethereumSepoliaNetwork, index)
  }

  async tapBitcoinTestNetwork(index = 0) {
    await Action.tapElementAtIndex(this.bitcoinTestnetNetwork, index)
  }

  async tapCustomTab() {
    await Action.tapElementAtIndex(this.customTab, 0)
  }

  async tapCeloMainnet() {
    await Action.tapElementAtIndex(this.celoNetworkName, 0)
  }

  async tapDropdown() {
    await Action.tapElementAtIndex(this.dropdown, 0)
  }

  async tapEditNetwork() {
    await Action.tapElementAtIndex(this.editNetwork, platformIndex)
  }

  async tapFavoritesTab() {
    await Action.tapElementAtIndex(this.favoritesTab, 0)
  }

  async tapNetworksTab() {
    await Action.tapElementAtIndex(this.networksTab, 1)
  }

  async tapNetworkInfo(network: string) {
    await Action.waitForElement(by.id(`info_svg__${network}`))
    await Action.tap(by.id(`info_svg__${network}`))
  }

  async verifyNetworkDetails({
    title,
    url,
    chainId,
    tokenSymbol,
    tokenName,
    explorerUrl
  }: {
    title: string
    url: string
    chainId: string
    tokenSymbol: string
    tokenName: string
    explorerUrl: string
  }) {
    // Verify Static text
    await Action.waitForElement(this.networkRpcUrlText)
    await Assert.isVisible(this.chainIdText)
    await Assert.isVisible(this.networkTokenSymbol)
    await Assert.isVisible(this.networkTokenNameText)
    await Assert.isVisible(this.explorerUrlText)
    // Verify network Data
    await Assert.hasText(by.id(`network_details_title__${title}`), title)
    await Assert.isVisible(by.text(url))
    await Assert.isVisible(by.text(chainId))
    await Assert.isVisible(by.text(tokenSymbol))
    await Assert.isVisible(by.text(tokenName))
    await Assert.isVisible(by.text(explorerUrl))
  }

  async tapSaveButton() {
    await Action.scrollToBottom(by.id('addEditNetwork_scroll_view'))
    while (await Action.isVisible(this.saveButton, 0)) {
      await Action.tapElementAtIndex(this.saveButton, 0)
    }
  }

  async tapArbCustomNetwork() {
    await Action.tapElementAtIndex(this.arbCustomNetwork, 0)
  }

  async tapDeleteNetwork() {
    await Action.tapElementAtIndex(this.deleteNetwork, platformIndex)
  }

  async inputNetworkRpcUrl(customRpcUrl: string) {
    await Action.setInputText(this.networkRpcUrl, customRpcUrl, 0)
  }

  async inputNetworkName(customNetworkName: string) {
    await Action.setInputText(this.networkName, customNetworkName, 0)
  }

  async inputChainId(customChainID: string) {
    await Action.setInputText(this.chainID, customChainID, 0)
  }

  async inputNativeTokenSymbol(customNativeTokenSymbol: string) {
    await Action.setInputText(
      this.nativeTokenSymbol,
      customNativeTokenSymbol,
      0
    )
    await Action.tap(this.nativeTokenSymbol)
  }

  async inputExplorerUrl(customExplorerUrl: string) {
    await Action.setInputText(this.explorerUrl, customExplorerUrl, 0)
  }

  async searchNetworks(network: string) {
    await Action.setInputText(commonElsPage.searchBar, network, 0)
  }

  async swipeUp(text: Detox.NativeMatcher = this.chainIdText) {
    await Action.swipeUp(text, 'fast', 0.5, 0)
  }

  async switchToEthereumSepoliaNetwork() {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapManageNetworks()
    await this.tapNetworksTab()
    await this.searchNetworks(networksManage.ethereumSepoliaNetwork)
    await this.tapStarSvgByNetwork(networksManage.ethereumSepoliaNetwork)
    await this.tapEthereumSepoliaNetwork(1)
  }

  async switchNetwork(network: string) {
    await PortfolioPage.tapNetworksDropdown()
    await Action.tapElementAtIndex(
      by.id(`network_dropdown__${network}`),
      platformIndex
    )
  }

  async switchActiveNetwork(network = 'Avalanche (C-Chain)') {
    await Action.scrollToTop(by.id(portfolioLoc.tokensTabListView))
    if (
      !(await Action.isVisible(by.id(portfolioLoc.activeNetwork + network), 0))
    ) {
      await this.switchNetwork(network)
    }
  }

  async switchToBitcoinTestNet() {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapNetworksDropdownBTCTestNet()
  }

  async verifyNetworkRow(network: string) {
    await Action.waitForElement(by.id(`network_list_item__${network}`))
  }

  async switchToAvalancheNetwork() {
    try {
      await PortfolioPage.tapNetworksDropdown()
    } catch (error) {
      console.log(
        'Networks dropdown is not visible, or has already been tapped'
      )
    }
    await PortfolioPage.tapNetworksDropdownAVAX()
  }

  async switchToFujiAvalanche(network = 'Avalanche (P-Chain)') {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapManageNetworks()
    await this.tapNetworksTab()
    await this.searchNetworks(network)
    await this.tapStarSvgByNetwork(network)
    await Action.tapElementAtIndex(by.text(network), 1)
  }

  async tapConnect() {
    await Action.tapElementAtIndex(this.connect, 0)
  }
}

export default new NetworksPage()
