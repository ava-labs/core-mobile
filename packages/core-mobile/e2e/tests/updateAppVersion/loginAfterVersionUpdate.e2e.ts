// import assertions from '../../helpers/assertions'
// import portfolioPage from '../../pages/portfolio.page'
import assertions from '../../helpers/assertions'
import { warmup } from '../../helpers/warmup'
import portfolioPage from '../../pages/portfolio.page'

describe('Verify version update', () => {
  beforeAll(async () => {
    await device.uninstallApp('com.avaxwallet')
  })

  it('should verify version update', async () => {
    await device.installApp(
      './e2e/tests/updateAppVersion/oldVersionApk/app-external-e2e-bitrise-signed.apk'
    )
    await warmup()
    await assertions.isVisible(portfolioPage.colectiblesTab)
    await device.installApp(process.env.BITRISE_SIGNED_APK_PATH)
  })
})
