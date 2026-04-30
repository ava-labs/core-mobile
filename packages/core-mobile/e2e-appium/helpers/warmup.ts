import onboardingPage from '../pages/onboarding.page'

export default async function warmup(
  mnemonic = process.env.E2E_MNEMONIC as string
) {
  // Validate mnemonic is provided
  if (!mnemonic) {
    throw new Error(
      'E2E_MNEMONIC environment variable is not set. Please set it before running tests.'
    )
  }

  await onboardingPage.exitMetro()
  await onboardingPage.tapAccessExistingWallet()
  await onboardingPage.tapTypeInRecoveryPhase()
  await onboardingPage.tapAgreeAndContinue()
  await onboardingPage.tapUnlockBtn()
  await onboardingPage.enterRecoveryPhrase(mnemonic)
  await onboardingPage.tapImport()
  // Enter PIN (this will also disable the biometrics toggle if needed)
  await onboardingPage.enterPin()
  await onboardingPage.tapNextBtnOnNameWallet()
  await onboardingPage.tapNextBtnOnAvatarScreen()
  await onboardingPage.tapLetsGo()
  await onboardingPage.verifyLoggedIn()
}

export async function killAndRestart() {
  if (driver.isIOS) {
    const appInfo = (await driver.execute('mobile: activeAppInfo')) as {
      bundleId: string
    }
    const bundleId = appInfo.bundleId
    await driver.execute('mobile: terminateApp', { bundleId })
    await driver.execute('mobile: activateApp', { bundleId })
  } else {
    const appId = 'org.avalabs.corewallet'
    try {
      await driver.terminateApp(appId)
      await driver.activateApp(appId)
    } catch (error) {
      await driver.terminateApp(appId + '.internal')
      await driver.activateApp(appId + '.internal')
    }
  }
}
