import { test } from '@playwright/test'
import CommonPlaywrightPage from '../../../pages/commonPlaywrightEls.page'
import actions from '../../../helpers/playwrightActions'
import { playwrightSetup } from '../../../helpers/playwrightSetup'
import DappsPlaywrightPage from '../../../pages/dappsPlaywright.page'

const getContext = playwrightSetup()

test('Connect Balancer', async () => {
  const { page } = getContext()
  const common = new CommonPlaywrightPage(page)
  const dapps = new DappsPlaywrightPage(page)

  await actions.open(dapps.balancerUrl, dapps.page)
  await common.tapConnectWallet()
  await common.tapWalletConnect()
  await common.tapOpen()
  const qrUri = await common.qrUriValue('wcm')
  if (qrUri) {
    await actions.writeQrCodeToFile(qrUri)
  }
  console.log('URI: ', qrUri)
})
