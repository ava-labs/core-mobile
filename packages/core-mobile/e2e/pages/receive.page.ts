import Actions from '../helpers/actions'
import ReceiveLoc from '../locators/receive.loc'
import commonElsPage from './commonEls.page'

class ReceiveAddressPage {
  get receiveIcon() {
    return by.id(ReceiveLoc.receiveIcon)
  }

  get receiveCryptoTitle() {
    return by.text(ReceiveLoc.receiveCryptoTitle)
  }

  get receiveCryptoSubtitle() {
    return by.text(ReceiveLoc.receiveCryptoSubtitle)
  }

  get receiveQrCode() {
    return by.id(ReceiveLoc.receiveQrCode)
  }

  get selectReceiveNetwork() {
    return by.id(ReceiveLoc.selectReceiveNetwork)
  }

  get receiveAddress() {
    return by.id(ReceiveLoc.receiveAddress)
  }

  get networkChainName() {
    return by.id(ReceiveLoc.networkChainName)
  }

  get copiedToastMsg() {
    return by.text(ReceiveLoc.copiedToastMsg)
  }

  get bitcoinLogo() {
    return by.id(ReceiveLoc.bitcoinLogo)
  }

  get ethLogo() {
    return by.id(ReceiveLoc.ethereumLogo)
  }

  get avaLogo() {
    return by.id(ReceiveLoc.avaLogo)
  }

  get cChainAddress() {
    return by.text(ReceiveLoc.cChainAddress)
  }

  get bitcoinAddress() {
    return by.text(ReceiveLoc.bitcoinAddress)
  }

  get xChainAddress() {
    return by.text(ReceiveLoc.xChainAddress)
  }

  get pChainAddress() {
    return by.text(ReceiveLoc.pChainAddress)
  }

  get selectedNetworkEVM() {
    return by.id(ReceiveLoc.selectedNetworkEVM)
  }

  get selectedNetworkXPChain() {
    return by.id(ReceiveLoc.selectedNetworkXPChain)
  }

  get selectedNetworkBitcoin() {
    return by.id(ReceiveLoc.selectedNetworkBitcoin)
  }

  async tapReceiveIcon() {
    await Actions.tap(this.receiveIcon)
  }

  async tapSelectReceiveNetwork() {
    await Actions.tap(this.selectReceiveNetwork)
  }

  async tapReceiveAddress() {
    await Actions.tap(this.receiveAddress)
  }

  async verifyReceiveScreen(network = 'Avalanche C-Chain/EVM') {
    await Actions.waitForElement(this.receiveCryptoTitle)
    await Actions.isVisible(this.receiveCryptoSubtitle, 0)
    await Actions.isVisible(this.receiveQrCode, 0)
    await Actions.isVisible(this.selectReceiveNetwork, 0)
    await Actions.isVisible(this.cChainAddress, 0)
    await Actions.isVisible(by.id(`receive_selected_network__${network}`), 0)
    await Actions.isVisible(by.text(network), 0)
    await Actions.isVisible(by.text(network), 1)
    await Actions.isVisible(commonElsPage.copy, 0)
  }
}

export default new ReceiveAddressPage()
