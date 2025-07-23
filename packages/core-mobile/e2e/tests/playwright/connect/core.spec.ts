import { test } from '@playwright/test'
import playwrightActions from '../../../helpers/playwrightActions'
import { playwrightSetup } from '../../../helpers/playwrightSetup'

test('Connect Core', async () => {
  const { common, core } = await playwrightSetup()
  await playwrightActions.open(core.coreUrl, core.page)
  await playwrightActions.tap(core.connectBtn, 10000)
  await playwrightActions.tap(core.coreMobile)
  await playwrightActions.tap(core.termsCheckBox)
  await playwrightActions.tap(core.continueBtn)
  await playwrightActions.tap(common.walletConnectBtn)
  const uri = await common.qrUriValue('wui')
  console.log('URI: ', uri)
  if (uri) {
    await playwrightActions.writeQrCodeToFile(uri)
  }
})
