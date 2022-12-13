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

  async tapViewOnExplorerButton() {
    await Action.tap(this.viewOnExplorerButton)
  }
}

export default new VerifyPhrasePage()
