import { test, expect } from '@playwright/test'
import actions from '../../helpers/actions'
import TraderJoePage from '../../pages/traderjoe.page'

test('check wallet connect button', async ({ page }) => {
  const traderJoePage = new TraderJoePage(page)

  await actions.openPage(traderJoePage.page, traderJoePage.homePage)
  await expect(traderJoePage.connectWalletButtonText).toBeVisible()
  await traderJoePage.clickConnectWalletButton()
  await expect(traderJoePage.walletConnectButton).toBeVisible()
  await traderJoePage.clickWalletConnectButton()
  await expect(traderJoePage.oldWalletConnectModal).toBeVisible()
  await traderJoePage.clickOldWalletConnectModal()
  const qrUri = await traderJoePage.qrUriValue()

  if (qrUri) {
    await actions.writeQrCodeToFile(qrUri)
  }

  console.log('Clipboard value:', qrUri)
})
