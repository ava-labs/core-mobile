/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import { warmup } from '../../helpers/warmup'
import browserLoc from '../../locators/browser.loc'
import browserPage from '../../pages/browser.page'
import popUpModalPage from '../../pages/popUpModal.page'
import settingsPage from '../../pages/settings.page'

describe('Connect core.app', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should connect core.app', async () => {
    await browserPage.connectToCore()
    await browserPage.verifyCoreConnected()
  }, 60000)

  it('should disconnect core.app', async () => {
    await settingsPage.disconnect(browserLoc.coreDappName)
    await popUpModalPage.verifyEmptyConnectedSites()
  })
})
