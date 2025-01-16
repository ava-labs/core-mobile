import fs from 'fs'
import ReviewAndSendLoc from '../locators/scanQrCode.loc'
import Actions from '../helpers/actions'

class ReviewAndSend {
  get uriInputField() {
    return by.id(ReviewAndSendLoc.uri)
  }

  getQrCode() {
    return fs.readFileSync('e2e/tests/dapps/playwright/qr_codes.txt', 'utf8')
  }

  async enterQrCode() {
    const qrCode = this.getQrCode().toString()
    console.log('entering here: ', qrCode)
    await Actions.setInputText(this.uriInputField, qrCode, 0)
  }

  async setQrCode(qrCode: string) {
    await Actions.setInputText(this.uriInputField, qrCode, 0)
  }
}

export default new ReviewAndSend()
