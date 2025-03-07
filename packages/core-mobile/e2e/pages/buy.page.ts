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

  get buyAvaxTitle() {
    return by.text(buyLoc.buyAvax)
  }

  get buyAlert() {
    return by.text(buyLoc.alert)
  }

  get halliday() {
    return by.text(buyLoc.halliday)
  }

  get hallidayLogo() {
    return by.id(buyLoc.hallidayLogo)
  }

  async verifyBuyPage(isWatchlistFlow = false) {
    if (isWatchlistFlow) {
      await Actions.waitForElementNoSync(this.buyAvaxTitle)
      await Actions.waitForElementNoSync(this.buyAlert)
    } else {
      await Actions.waitForElement(this.buyTitle)
    }
    await Actions.waitForElementNoSync(this.continueWith)
    await Actions.waitForElementNoSync(this.moonPay)
    await Actions.waitForElementNoSync(this.moonPayLogo)
    await Actions.waitForElementNoSync(this.coinbasePay)
    await Actions.waitForElementNoSync(this.coinbasePayLogo)
    await Actions.waitForElementNoSync(this.halliday)
    await Actions.waitForElementNoSync(this.hallidayLogo)
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

  async tapCancel() {
    await Actions.tap(this.cancel)
  }
}

export default new BuyPage()
