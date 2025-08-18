import Actions from '../helpers/actions'
import assertions from '../helpers/assertions'
import commonElsLoc from '../locators/commonEls.loc'
import ReceiveLoc from '../locators/receive.loc'
import commonElsPage from './commonEls.page'

class ReceiveAddressPage {
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

  get evmSupportedAddressText() {
    return by.id(ReceiveLoc.evmSupportedAddressText)
  }

  async verifyReceiveScreen(network: string, address: string) {
    await Actions.waitForElement(this.receiveCryptoTitle)
    await assertions.isVisible(this.receiveCryptoSubtitle)
    await assertions.isVisible(this.receiveQrCode)
    await assertions.isVisible(this.selectReceiveNetwork)
    await assertions.isVisible(by.id(`receive_address__${address}`))
    await assertions.isVisible(by.id(`receive_selected_network__${network}`), 0)
    await assertions.isVisible(by.text(network), 0)
    await assertions.isVisible(commonElsPage.copy, 0)
    if (network === commonElsLoc.evm) {
      await assertions.isVisible(this.evmSupportedAddressText)
    }
  }

  async selectNetwork(network: string) {
    await Actions.waitAndTap(this.selectReceiveNetwork)
    await Actions.waitAndTap(by.id(`select_network__${network}`), 2000)
  }
}

export default new ReceiveAddressPage()
