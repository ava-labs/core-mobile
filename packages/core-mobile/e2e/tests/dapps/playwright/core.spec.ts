import { test } from '@playwright/test'
import CoreApp from '../../../pages/coreApp.page'
import CommonPlaywrightPage from '../../../pages/commonPlaywrightEls.page'
import playwrightActions from '../../../helpers/playwrightActions'
import { playwrightSetup } from '../../../helpers/playwrightSetup'

const getContext = playwrightSetup()

test('Connect Core', async () => {
  const { page } = getContext()
  const common = new CommonPlaywrightPage(page)
  const core = new CoreApp(page)

  await playwrightActions.open(core.coreUrl, core.page)
  await playwrightActions.tap(core.connect, 10000)
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
