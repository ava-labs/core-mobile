import currencyLoc from '../../locators/burgerMenu/currency.loc'
import Actions from '../../helpers/actions'

class Currency {
  get euroCurrency() {
    return by.text(currencyLoc.euroCurrency)
  }

  get euroSign() {
    return by.text(currencyLoc.euroSign)
  }

  get usdCurrency() {
    return by.text(currencyLoc.usdCurrency)
  }

  get usdSign() {
    return by.text(currencyLoc.usdSign)
  }

  async tapEuroCurrency() {
    await Actions.tapElementAtIndex(this.euroCurrency, 0)
  }

  async tapUSDCurrency() {
    await Actions.tapElementAtIndex(this.usdCurrency, 0)
  }
}

export default new Currency()
