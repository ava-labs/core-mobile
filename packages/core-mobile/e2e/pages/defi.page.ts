import Assert from '../helpers/assertions'
import defi from '../locators/defi.loc'
import Actions from '../helpers/actions'

class DefiPage {
  get emptyScreenTitle() {
    return by.text(defi.emptyScreenTitle)
  }

  get emptyScreenDescription() {
    return by.text(defi.emptyScreenDescription)
  }

  get exploreButton() {
    return by.id(defi.exploreButton)
  }

  get goToProtocolButton() {
    return by.id(defi.goToProtocolButton)
  }

  get headerBack() {
    return by.id(defi.headerBack)
  }

  get linkSvg() {
    return by.id(defi.linkSvg)
  }

  get protocolLogo() {
    return by.id(defi.protocolLogo)
  }

  get protocolName() {
    return by.id(defi.protocolName)
  }

  get networkLogo() {
    return by.id(defi.networkLogo)
  }

  get networkName() {
    return by.id(defi.networkName)
  }

  get valueText() {
    return by.text(defi.valueText)
  }

  get usdValue() {
    return by.id(defi.usdValue)
  }

  async tapDefiProtocol() {
    await Actions.tapElementAtIndex(this.protocolLogo, 0)
  }

  async tapHeaderBack() {
    await Actions.tap(this.headerBack)
  }

  async verifyEmptyScreenItems() {
    await Assert.isVisible(this.emptyScreenTitle)
    await Assert.isVisible(this.emptyScreenDescription)
    await Assert.isVisible(this.exploreButton)
    await Assert.isVisible(this.linkSvg)
  }

  async verifyDefiListItems() {
    await Assert.isVisible(this.protocolLogo)
    await Assert.isVisible(this.protocolName)
    await Assert.isVisible(this.networkLogo)
    await Assert.isVisible(this.usdValue)
  }

  async verifyDefiProtocolItems() {
    await Assert.isVisible(this.protocolLogo)
    await Assert.isVisible(this.protocolName)
    await Assert.isVisible(this.networkLogo)
    await Assert.isVisible(this.networkName)
    await Assert.isVisible(this.linkSvg)
    await Assert.isVisible(this.usdValue)
    await Assert.isVisible(this.valueText)
    await Assert.isVisible(this.goToProtocolButton)
  }
}

export default new DefiPage()
