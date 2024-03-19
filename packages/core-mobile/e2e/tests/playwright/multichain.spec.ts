import { test, expect } from '@playwright/test'
import CommonPlaywrightPage from '../../pages/commonPlaywrightEls.page'
import MultichainPage from '../../pages/multichain.page'
import actions from '../../helpers/actions'

test('check wallet connect button', async ({ page, context }) => {
  const commonEls = new CommonPlaywrightPage(page)
  const multichainPage = new MultichainPage(page)

  await actions.openPage(multichainPage.page, multichainPage.multichainHomepage)

  await expect(commonEls.connectToAWalletBtn).toBeVisible()
  await commonEls.clickConnectToAWalletBtn()
  await expect(commonEls.walletConnectBtn).toBeVisible()
  await commonEls.clickWalletConnectBtn()
  await expect(commonEls.walletConnectUri).toBeVisible()
  await commonEls.walletConnectUriValue()

  await context.grantPermissions(['clipboard-read'])

  const clipboardValue = await page.evaluate(() => {
    // @ts-ignore
    return navigator.clipboard.readText()
  })

  await actions.writeQrCodeToFile(clipboardValue)

  console.log('URI: ', clipboardValue)
})
