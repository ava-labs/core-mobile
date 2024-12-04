import { handleJailbrokenWarning } from '../../helpers/warmup'
import loginRecoverWallet from '../../helpers/loginRecoverWallet'
import portfolioPage from '../../pages/portfolio.page'
import createPinPage from '../../pages/createPin.page'

describe('Install older version of app and login', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES', camera: 'YES' },
      launchArgs: {
        detoxURLBlacklistRegex: [
          '.*cloudflare-ipfs.*',
          '.*[ipfs.io/ipfs].*',
          '.*[amazonaws.com].*'
        ],
        detoxEnableSynchronization: 0
      }
    })
    await handleJailbrokenWarning()
    await loginRecoverWallet.recoverMnemonicWallet()
    console.log('Logged in successfully!')
    await device.launchApp({
      newInstance: false
    })
  })

  it('should fail', async () => {
    await createPinPage.enterCurrentPin()
    failOnTimeout(async () => {
      await portfolioPage.verifyPorfolioScreen()
    })
    console.log('Test is supposed to pass and you should see this message!')
  })
})

interface FailOnTimeoutFunction {
  (): void
}

async function failOnTimeout(func: FailOnTimeoutFunction): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const setTimeout = (f: () => void): void => {
    throw new Error(`Executing timeout \n ${f.toString()} \n`)
  }

  // A small trick to change scope:
  // eslint-disable-next-line no-eval
  eval('(' + func.toString() + ')()')
}
