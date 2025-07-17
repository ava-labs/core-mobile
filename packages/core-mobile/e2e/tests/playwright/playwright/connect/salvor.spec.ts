import { test } from '@playwright/test'
import CommonPlaywrightPage from '../../../../pages/commonPlaywrightEls.page'
import actions from '../../../../helpers/playwrightActions'
import { playwrightSetup } from '../../../../helpers/playwrightSetup'
import DappsPlaywrightPage from '../../../../pages/dappsPlaywright.page'

test('Connect Salvor', async () => {
  const { page } = await playwrightSetup()
  const common = new CommonPlaywrightPage(page)
  const dapps = new DappsPlaywrightPage(page)

  await actions.open(dapps.salvorUrl, dapps.page)
  await actions.tap(dapps.salvorXbtn)
  await common.tapConnectWallet()
  await common.tapWallet_Connect()
  await common.tapWalletConnect()
  const qrUri = await common.qrUriValue('wui')
  if (qrUri) {
    await actions.writeQrCodeToFile(qrUri)
  }
  console.log('URI: ', qrUri)
})
