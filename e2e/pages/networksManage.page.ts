import Action from '../helpers/actions'
import networksManage from '../locators/networksManage.loc'
import { Platform } from '../helpers/constants'

const platformIndex = Action.platform() === Platform.iOS ? 1 : 0

class NetworksPage {
  get addNetwork() {
    return by.id(networksManage.addNetwork)
  }

  get bitcoinTestnet() {
    return by.text(networksManage.bitcoinTestnet)
  }

  get chainID() {
    return by.text(networksManage.chainID)
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

  get ethereumGoerlyNetwork() {
    return by.text(networksManage.ethereumGoerlyNetwork)
  }

  get ethTokenOnCustomNetwork() {
    return by.text(networksManage.ethTokenOnCustomNetwork)
  }

  get explorerUrl() {
    return by.text(networksManage.explorerUrl)
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
    return by.text(networksManage.nativeTokenSymbol)
  }

  get networksTab() {
    return by.text(networksManage.networksTab)
  }

  get networkName() {
    return by.text(networksManage.networkName)
  }

  get networkRpcUrl() {
    return by.text(networksManage.networkRpcUrl)
  }

  get networkInfo() {
    return by.id(networksManage.networkInfo)
  }

  get newCustomNetworkName() {
    return by.text(networksManage.newCustomNetworkName)
  }

  get customTab() {
    return by.text(networksManage.customTab)
  }

  get saveButton() {
    return by.text(networksManage.saveButton)
  }

  get customNetwork() {
    return by.text(networksManage.customNetworkName)
  }

  async addBtcNetwork() {
    await Action.tapElementAtIndex(this.favoriteNetwork, 0)
  }

  async tapAddNetwork() {
    await Action.tapElementAtIndex(this.addNetwork, 0)
  }

  async tapEthereumGoerliNetwork() {
    await Action.tapElementAtIndex(this.ethereumGoerlyNetwork, 0)
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
    await Action.tapElementAtIndex(this.networksTab, 1)
  }

  async tapNetworkInfo() {
    await Action.tapElementAtIndex(this.networkInfo, 0)
  }

  async tapNewCustomNetwork() {
    await Action.tapElementAtIndex(this.newCustomNetworkName, 0)
  }

  async tapSaveButton() {
    await Action.tapElementAtIndex(this.saveButton, 0)
  }

  async tapCustomNetwork() {
    await Action.tapElementAtIndex(this.customNetwork, 0)
  }

  async tapDeleteNetwork() {
    await Action.tapElementAtIndex(this.deleteNetwork, platformIndex)
  }

  async inputNetworkRpcUrl() {
    await Action.setInputText(
      this.inputTextField,
      networksManage.customRpcUrl,
      0
    )
    await Action.tap(this.networkRpcUrl)
  }

  async inputNetworkName() {
    await Action.setInputText(
      this.inputTextField,
      networksManage.customNetworkName,
      1
    )
    await Action.tap(this.networkName)
  }

  async inputNewNetworkName() {
    await Action.setInputText(
      this.inputTextField,
      networksManage.newCustomNetworkName,
      1
    )
    await Action.tap(this.networkName)
  }

  async inputChainId() {
    await Action.setInputText(
      this.inputTextField,
      networksManage.customChainID,
      2
    )
    await Action.tap(this.chainID)
  }

  async inputNativeTokenSymbol() {
    await Action.setInputText(
      this.inputTextField,
      networksManage.customNativeTokenSymbol,
      3
    )
    await Action.tap(this.nativeTokenSymbol)
  }

  async inputExplorerUrl() {
    await Action.setInputText(
      this.inputTextField,
      networksManage.customExplorerUrl,
      5
    )
    await Action.tap(this.explorerUrl)
  }

  async swipeUp() {
    await Action.swipeUp(this.inputTextField, 'fast', 0.5, 5)
  }
}

export default new NetworksPage()
