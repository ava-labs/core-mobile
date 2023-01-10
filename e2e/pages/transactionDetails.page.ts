import Action from '../helpers/actions'
import transactionDetails from '../locators/transactionDetails.loc'

class VerifyPhrasePage {
  get viewOnExplorerButton() {
    return by.id(transactionDetails.viewOnExplorerButton)
  }

  get logo() {
    return by.id(transactionDetails.logo)
  }

  get status() {
    return by.text(transactionDetails.status)
  }

  get date() {
    return by.id(transactionDetails.date)
  }

  get toFrom() {
    return by.id(transactionDetails.to_from)
  }

  get transactionType() {
    return by.id(transactionDetails.transactionType)
  }

  async isDateTextOlderThan(time: number) {
    // Types need to be updated in detox library and thats why we have to ignore this error for now
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const atts: any = await Action.getAttributes(this.date)
    const dateObject = Date.parse(atts.text)
    const diff = Date.now() - dateObject
    console.log(diff)

    // Time is calculated in milliseconds now argument can be entered in seconds
    if (diff > time * 10000) {
      console.log('the date of the transaction is older than 5 minutes!!!')
      return false
    } else {
      return true
    }
  }

  async tapViewOnExplorerButton() {
    await Action.tap(this.viewOnExplorerButton)
  }
}

export default new VerifyPhrasePage()
