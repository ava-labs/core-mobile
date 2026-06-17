import onboardingPage from '../pages/onboarding.page'
import portfolioPage from '../pages/portfolio.page'
import { actions } from './actions'

type AppState = 'loggedIn' | 'locked' | 'onboarding'

async function detectAppState(): Promise<AppState> {
  const isLoggedIn = await actions.isElementVisible(
    portfolioPage.portfolioBalanceHeader,
    3000
  )
  if (isLoggedIn) return 'loggedIn'

  // forgot_pin_btn only appears on the PIN lock screen
  const isLocked = await actions.isElementVisible(
    onboardingPage.forgotPin,
    3000
  )
  if (isLocked) return 'locked'

  return 'onboarding'
}

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

  const state = await detectAppState()
  console.log(`App state detected: ${state}`)

  if (state === 'loggedIn') {
    console.log('Already logged in, skipping onboarding')
    return
  }

  if (state === 'locked') {
    console.log('App is locked, entering PIN to unlock')
    await onboardingPage.unlockEnterPin()
    await onboardingPage.verifyLoggedIn()
    return
  }

  // Full onboarding flow
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

export function getAndroidAppId(): string {
  const caps = driver.capabilities as Record<string, string>
  const appId = caps.appPackage || caps['appium:appPackage']
  if (!appId)
    throw new Error(
      'Could not determine Android app package from session capabilities'
    )
  return appId
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
    const appId = getAndroidAppId()
    await driver.terminateApp(appId)
    await driver.activateApp(appId)
  }
}
