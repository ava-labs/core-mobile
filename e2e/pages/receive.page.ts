import Actions from '../helpers/actions'
import ReceiveLoc from '../locators/receive.loc'

class ReceiveAddressPage {
  get receiveQrCode() {
    return by.id(ReceiveLoc.receiveQrCode)
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

  get btcLogo() {
    return by.id(ReceiveLoc.bitcoinLogo)
  }

  get ethLogo() {
    return by.id(ReceiveLoc.ethereumLogo)
  }

  get avaLogo() {
    return by.id(ReceiveLoc.avaLogo)
  }

  async tapReceiveAddress() {
    await Actions.tap(this.receiveAddress)
  }

  async verifyReceiveAddressPage() {
    await Actions.isVisible(this.receiveQrCode, 0)
    await Actions.isVisible(this.receiveAddress, 0)
    await Actions.isVisible(this.networkChainName, 0)
  }
}

export default new ReceiveAddressPage()
