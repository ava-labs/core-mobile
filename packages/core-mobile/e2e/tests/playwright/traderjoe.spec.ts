import { test, expect } from '@playwright/test'
import actions from '../../helpers/actions'
import TraderJoePage from '../../pages/traderjoe.page'
import CommonElsPage from '../../pages/commonPlaywrightEls.page'

test('check wallet connect button', async ({ page }) => {
  const traderJoePage = new TraderJoePage(page)
  const commonElsPage = new CommonElsPage(page)

  await actions.openPage(traderJoePage.page, traderJoePage.homePage)
  await expect(commonElsPage.connectWalletBtn).toBeVisible()
  await commonElsPage.clickConnectWalletBtn()
  await expect(commonElsPage.walletConnectBtn).toBeVisible()
  await commonElsPage.clickWalletConnectBtn()
  await expect(traderJoePage.oldWalletConnectModal).toBeVisible()
  await traderJoePage.clickOldWalletConnectModal()
  const qrUri = await commonElsPage.qrUriValue()

  if (qrUri) {
    await actions.writeQrCodeToFile(qrUri)
  }

  console.log('Clipboard value:', qrUri)
})
