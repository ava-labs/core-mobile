import { test, expect } from '@playwright/test'
import actions from '../../helpers/actions'
import UniswapPage from '../../pages/uniswap.page'
import CommonElsPage from '../../pages/commonPlaywrightEls.page'

test('check wallet connect button', async ({ page }) => {
  const uniswapPage = new UniswapPage(page)
  const commonElsPage = new CommonElsPage(page)

  await actions.openPage(uniswapPage.page, uniswapPage.uniswapHomePage)
  await expect(uniswapPage.connectWalletBtn).toBeVisible()
  await uniswapPage.clickConnectBtn()
  await expect(commonElsPage.walletConnectBtn).toBeVisible()
  await commonElsPage.clickWalletConnectBtn()
  const qrCode = await commonElsPage.qrUriValue()

  if (qrCode) {
    await actions.writeQrCodeToFile(qrCode)
  }
  console.log('Clipboard value:', qrCode)
})
