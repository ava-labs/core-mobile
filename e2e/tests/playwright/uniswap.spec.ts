import { test, expect } from '@playwright/test'
import actions from '../../helpers/actions'
import UniswapPage from '../../pages/uniswap.page'

test('check wallet connect button', async ({ page }) => {
  const uniswapPage = new UniswapPage(page)

  await actions.openPage(uniswapPage.page, uniswapPage.uniswapHomePage)
  await expect(uniswapPage.connectWalletBtn).toBeVisible()
  await uniswapPage.clickConnectBtn()
  await expect(uniswapPage.walletConnectBtn).toBeVisible()
  await uniswapPage.clickWalletConnectBtn()
  const qrCode = await uniswapPage.qrCodeUri()

  if (qrCode) {
    await actions.writeQrCodeToFile(qrCode)
  }
  console.log('Clipboard value:', qrCode)
})
