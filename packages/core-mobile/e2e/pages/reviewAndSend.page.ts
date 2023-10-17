import ReviewAndSendLoc from '../locators/reviewAndSend.loc'
import Actions from '../helpers/actions'

class ReviewAndSend {
  get reviewAndSendNow() {
    return by.text(ReviewAndSendLoc.sendNow)
  }

  get balanceAfterTransaction() {
    return by.id(ReviewAndSendLoc.balanceAfterTransaction)
  }

  get networkFee() {
    return by.id(ReviewAndSendLoc.networkFee)
  }

  get amount() {
    return by.id(ReviewAndSendLoc.amount)
  }

  get sendPendingToastMsg() {
    return by.text(ReviewAndSendLoc.sendTokenPending)
  }

  get sendSuccessfulToastMsg() {
    return by.text(ReviewAndSendLoc.sendSuccessful)
  }

  async tapSendNow() {
    await Actions.tap(this.reviewAndSendNow)
  }
}

export default new ReviewAndSend()
