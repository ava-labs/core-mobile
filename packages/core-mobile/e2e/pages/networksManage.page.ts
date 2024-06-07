import Action from '../helpers/actions'
import networksManage from '../locators/networksManage.loc'
import { Platform } from '../helpers/constants'
import PortfolioPage from './portfolio.page'

const platformIndex = Action.platform() === Platform.iOS ? 1 : 0

class NetworksPage {
  get addNetwork() {
    return by.id(networksManage.addNetwork)
  }

  get bitcoinTestnet() {
    return by.text(networksManage.bitcoinTestnet)
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

  get ethTokenOnCustomNetwork() {
    return by.text(networksManage.ethTokenOnCustomNetwork)
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

  get headerBack() {
    return by.id(networksManage.headerBack)
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

  get networkInfo() {
    return by.id(networksManage.networkInfo)
  }

  get arbWrongCustomNetworkName() {
    return by.text(networksManage.arbWrongCustomNetworkName)
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

  get searchBar() {
    return by.id(networksManage.searchBar)
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

  async tapStarSvgByIndex(index: number) {
    await Action.tapElementAtIndex(this.starSvg, index)
  }

  async tapBitcoin() {
    await Action.tapElementAtIndex(this.bitcoin, 0)
  }

  async addBtcNetwork() {
    await Action.tapElementAtIndex(this.favoriteNetwork, 2)
  }

  async tapAddNetwork() {
    await Action.tapElementAtIndex(this.addNetwork, 0)
  }

  async tapEthereumSepoliaNetwork() {
    await Action.tapElementAtIndex(this.ethereumSepoliaNetwork, 0)
  }

  async tapCustomTab() {
    await Action.tapElementAtIndex(this.customTab, 0)
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

  async tapHeaderBack() {
    await Action.tapElementAtIndex(this.headerBack, 0)
  }

  async tapNetworksTab() {
    await Action.tapElementAtIndex(this.networksTab, 0)
  }

  async tapNetworkInfo() {
    await Action.tapElementAtIndex(this.networkInfo, 0)
  }

  async tapPolygonCustomNetwork() {
    await Action.tapElementAtIndex(this.polygonCustomNetwork, 0)
  }

  async tapSaveButton() {
    await Action.tapElementAtIndex(this.saveButton, 0)
    await Action.tapElementAtIndex(this.saveButton, 0)
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
    await Action.setInputText(this.searchBar, network, 0)
  }

  async swipeUp() {
    await Action.swipeUp(this.chainIdText, 'fast', 0.5, 0)
  }

  async switchToEthereumSepoliaNetwork() {
    await PortfolioPage.tapNetworksDropdown()
    if (
      (await Action.isVisible(PortfolioPage.manageNetworks, platformIndex)) ===
      false
    ) {
      await PortfolioPage.tapNetworksDropdown()
    }
    await PortfolioPage.tapManageNetworks()
    await this.tapNetworksTab()
    if ((await Action.isVisible(this.ethereumSepoliaNetwork, 0)) === false) {
      await Action.swipeUp(this.bitcoinTestnet, 'slow', 0.5, 0)
    }
    await this.tapEthereumSepoliaNetwork()
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
}

export default new NetworksPage()
