import { test, expect } from '@playwright/test'
import CommonPlaywrightPage from '../../pages/commonPlaywrightEls.page'
import YieldYakPage from '../../pages/yieldyak.page'
import actions from '../../helpers/actions'

test('check wallet connect button', async ({ page, context }) => {
  const commonEls = new CommonPlaywrightPage(page)
  const yieldYak = new YieldYakPage(page)

  await actions.openPage(yieldYak.page, yieldYak.yieldYakHomepage)

  await expect(commonEls.connectWalletBtn).toBeVisible()
  await commonEls.clickConnectWalletBtn()
  await expect(yieldYak.showMoreBtn).toBeVisible()
  await yieldYak.clickShowMoreBtn()
  await expect(commonEls.walletConnectBtn).toBeVisible()
  await commonEls.clickWalletConnectBtn()
  await expect(commonEls.walletConnectUri).toBeVisible()
  await commonEls.walletConnectUriValue()

  await context.grantPermissions(['clipboard-read'])

  const clipboardValue = await page.evaluate(() => {
    return navigator.clipboard.readText()
  })

  actions.writeQrCodeToFile(clipboardValue)

  console.log('URI: ', clipboardValue)
})
