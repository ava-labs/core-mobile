/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs'
import { Page } from '@playwright/test'
import actions from '../helpers/actions'
const QrCode = require('qrcode-reader')
const Jimp = require('jimp')

class PangolinPage {
  page: Page

  constructor(page: Page) {
    this.page = page
  }

  get pangolinHomepage() {
    return 'https://app.pangolin.exchange/'
  }

  get qrCodeSvg() {
    return this.page.locator('svg[width="256"]')
  }

  async decodeQrCode() {
    const svgImage = this.page.locator('svg[width="256"]')
    await svgImage?.screenshot({
      path: './e2e/tests/playwright/qrCode.png'
    })
    const svgImageBuffer = fs.readFileSync('./e2e/tests/playwright/qrCode.png')
    Jimp.read(svgImageBuffer, function (err: any, image: any) {
      if (err) {
        console.log(err)
      }
      const qr = new QrCode()
      qr.callback = function (error: any, value: { result: any }) {
        if (error) {
          console.error(err)
        }
        actions.writeQrCodeToFile(value.result)
        console.log(value.result)
      }

      qr.decode(image.bitmap)
    })
  }
}

export default PangolinPage
