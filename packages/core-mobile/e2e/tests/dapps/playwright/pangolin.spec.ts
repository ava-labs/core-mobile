import { test } from '@playwright/test'
import CommonPlaywrightPage from '../../../pages/commonPlaywrightEls.page'
import actions from '../../../helpers/playwrightActions'
import { playwrightSetup } from '../../../helpers/playwrightSetup'
import DappsPlaywrightPage from '../../../pages/dappsPlaywright.page'

const getContext = playwrightSetup()

test('Connect Pangolin', async () => {
  const { page } = getContext()
  const common = new CommonPlaywrightPage(page)
  const dapps = new DappsPlaywrightPage(page)

  await actions.open(dapps.pangolinUrl, dapps.page)
  await common.tapConnectToAWallet()
  await actions.tap(dapps.pangolinAgree)
  await common.tapConnectToAWallet(2)
  await common.tapWalletConnect()
  await common.tapOpen()

  const qrUri = await common.qrUriValue()
  if (qrUri) {
    await actions.writeQrCodeToFile(qrUri)
  }
  console.log('URI: ', qrUri)
})