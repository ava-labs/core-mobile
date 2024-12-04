import { handleJailbrokenWarning } from '../../helpers/warmup'
import loginRecoverWallet from '../../helpers/loginRecoverWallet'
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
  })

  it('should fail', async () => {
    await createPinPage.enterCurrentPin()
    console.log('Test is supposed to pass and you should see this message!')
  })
})
