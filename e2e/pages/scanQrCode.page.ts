import fs from 'fs'
import ReviewAndSendLoc from '../locators/scanQrCode.loc'
import Actions from '../helpers/actions'
import ConnectToSitePage from './connectToSite.page'

class ReviewAndSend {
  get uriInputField() {
    return by.id(ReviewAndSendLoc.uri)
  }

  getQrCode() {
    const qrCode = fs.readFileSync('e2e/tests/playwright/qr_codes.txt', 'utf8')
    return qrCode
  }

  async enterQrCode() {
    const qrCode = this.getQrCode().toString()
    await Actions.setInputText(this.uriInputField, qrCode, 0)
    await Actions.waitForElement(ConnectToSitePage.approveBtn, 10000)
  }
}

export default new ReviewAndSend()
