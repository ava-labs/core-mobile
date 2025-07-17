import { test } from '@playwright/test'
import CommonPlaywrightPage from '../../../../pages/commonPlaywrightEls.page'
import actions from '../../../../helpers/playwrightActions'
import { playwrightSetup } from '../../../../helpers/playwrightSetup'
import DappsPlaywrightPage from '../../../../pages/dappsPlaywright.page'

test('Connect SteakHut', async () => {
  const { page } = await playwrightSetup()
  const common = new CommonPlaywrightPage(page)
  const dapps = new DappsPlaywrightPage(page)

  await actions.open(dapps.steakHutUrl, dapps.page)
  await common.tapConnectWallet()
  await common.tapWalletConnect()
  await common.tapOpen()
  const qrUri = await common.qrUriValue()
  if (qrUri) {
    await actions.writeQrCodeToFile(qrUri)
  }
  console.log('URI: ', qrUri)
})
