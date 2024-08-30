import Actions from '../helpers/actions'
import assertions from '../helpers/assertions'
import buyLoc from '../locators/buy.loc'

class BuyPage {
  get moonPay() {
    return by.text(buyLoc.moonPay)
  }

  get coinbasePay() {
    return by.text(buyLoc.coinbasePay)
  }

  get buyTitle() {
    return by.text(buyLoc.buy)
  }

  get continueWith() {
    return by.text(buyLoc.continueWith)
  }

  get readCarefully() {
    return by.text(buyLoc.readCarefully)
  }

  get moonPayLogo() {
    return by.id(buyLoc.moonPayLogo)
  }

  get coinbasePayLogo() {
    return by.id(buyLoc.coinbasePayLogo)
  }

  get confirm() {
    return by.text(buyLoc.confirm)
  }

  get cancel() {
    return by.text(buyLoc.cancel)
  }

  async verifyBuyPage() {
    await Actions.waitForElement(this.buyTitle)
    await assertions.isVisible(this.continueWith)
    await assertions.isVisible(this.moonPay)
    await assertions.isVisible(this.moonPayLogo)
    await assertions.isVisible(this.coinbasePay)
    await assertions.isVisible(this.coinbasePayLogo)
  }

  async tapMoonPay() {
    await Actions.tap(this.moonPayLogo)
  }

  async tapCoinbasePay() {
    await Actions.tap(this.coinbasePayLogo)
  }

  async verifyReadCarefully(text: string) {
    await Actions.waitForElement(this.readCarefully)
    await assertions.isVisible(
      by.text(
        `Clicking “Continue” will take you to a page powered by our partner ${text}.`
      )
    )
    await assertions.isVisible(by.text(`Proceed to ${text}?`))
    await assertions.isVisible(
      by.text(`Use is subject to ${text}'s terms and policies.`)
    )
    await assertions.isVisible(this.confirm)
    await assertions.isVisible(this.cancel)
  }

  async tapConfirm() {
    await Actions.tap(this.confirm)
  }
}

export default new BuyPage()
