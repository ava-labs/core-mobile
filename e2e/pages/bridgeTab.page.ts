import Actions from '../helpers/actions'
import { Platform } from '../helpers/constants'
import bridgeTab from '../locators/bridgeTab.loc'

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

  get headerBack() {
    return by.id(bridgeTab.headerBack)
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

  async tapAvalanceNetwork() {
    return Actions.tapElementAtIndex(this.avalancheNetwork, platformIndex2)
  }

  async tapBitcoinNetwork() {
    return Actions.tapElementAtIndex(this.bitcoinNetwork, platformIndex)
  }

  async tapClose() {
    return Actions.tap(this.closebutton)
  }

  async tapBtcToken() {
    return Actions.tapElementAtIndex(this.btcToken, platformIndex)
  }

  async tapEthereumNetwork() {
    return Actions.tapElementAtIndex(this.ethereumNetwork, platformIndex)
  }

  async tapEthBridgeTransaction() {
    return Actions.tapElementAtIndex(this.ethBridgeTransaction, 0)
  }

  async tapHeaderBack() {
    await Actions.tapElementAtIndex(this.headerBack, 0)
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
}

export default new BridgeTabPage()
