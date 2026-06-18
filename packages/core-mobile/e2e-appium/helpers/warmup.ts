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
  if (process.env.IS_SEEDLESS === 'true') {
    console.log('Starting the seedless onboarding...')
    return warmupSeedless()
  }

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

function generateSeedlessIdToken(): string {
  const { createPrivateKey, createSign } =
    require('crypto') as typeof import('crypto')

  const pk = process.env.TEST_OIDC_PRIVATE_KEY
  const issuer = process.env.TEST_OIDC_ISSUER
  const audience = process.env.TEST_OIDC_AUDIENCE
  const sub = process.env.TEST_OIDC_SUB
  const email = 'mobile-test-seedless@avalabs.org'

  if (!pk || !issuer || !audience) {
    throw new Error(
      [
        'Seedless warmup requires custom OIDC credentials.',
        'Set TEST_OIDC_PRIVATE_KEY, TEST_OIDC_ISSUER, and TEST_OIDC_AUDIENCE.'
      ].join('\n')
    )
  }

  const base64 = pk
    .replace(/-----BEGIN [^-]+-----|-----END [^-]+-----/g, '')
    .replace(/\\n/g, '')
    .replace(/[^A-Za-z0-9+/=]/g, '')
  const pem = `-----BEGIN PRIVATE KEY-----\n${(
    base64.match(/.{1,64}/g) ?? []
  ).join('\n')}\n-----END PRIVATE KEY-----`
  const privateKey = createPrivateKey(pem)

  const header = Buffer.from(
    JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'test-key-1' })
  ).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  const payload = Buffer.from(
    JSON.stringify({
      iss: issuer,
      aud: audience,
      sub,
      email,
      iat: now,
      exp: now + 3600
    })
  ).toString('base64url')

  const data = `${header}.${payload}`
  const signer = createSign('RSA-SHA256')
  signer.update(data)
  return `${data}.${signer.sign(privateKey).toString('base64url')}`
}

export async function warmupSeedless() {
  await onboardingPage.exitMetro()

  const state = await detectAppState()
  console.log(`App state detected (seedless): ${state}`)

  const idToken = generateSeedlessIdToken()

  // Place JWT in clipboard; app reads it in E2E mode when Continue with Google is tapped
  // setClipboard requires base64-encoded content on Android
  await driver.setClipboard(
    Buffer.from(idToken).toString('base64'),
    'plaintext'
  )
  await driver.pause(500)

  await onboardingPage.tapContinueWithGoogle()
  await onboardingPage.tapAgreeAndContinue()
  await onboardingPage.tapSkip()
  await onboardingPage.tapUnlockBtn()
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
