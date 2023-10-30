import { test, expect } from '@playwright/test'
import actions from '../../helpers/actions'
import CommonPlaywrightPage from '../../pages/commonPlaywrightEls.page'
import Opensea from '../../pages/opensea.page'

test('check wallet connect button', async ({ page }) => {
  const commonEls = new CommonPlaywrightPage(page)
  const openseaPage = new Opensea(page)

  await actions.openPage(openseaPage.page, openseaPage.openseaHomepage)
  await expect(commonEls.connectWalletBtn).toBeVisible()
  await commonEls.clickConnectWalletBtn()
  await expect(commonEls.walletConnectBtn).toBeVisible()
  await commonEls.clickWalletConnectBtn(1)
  await expect(commonEls.wcmWalletUri).toBeVisible()
  const qrUri = await commonEls.qrUriValue('wcm')

  if (qrUri) {
    await actions.writeQrCodeToFile(qrUri)
  }

  console.log('URI: ', qrUri)
})
