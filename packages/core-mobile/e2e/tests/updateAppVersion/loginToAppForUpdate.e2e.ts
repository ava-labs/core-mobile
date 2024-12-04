import { handleJailbrokenWarning } from '../../helpers/warmup'
import loginRecoverWallet from '../../helpers/loginRecoverWallet'

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
        detoxEnableSynchronization: 'NO'
      }
    })
    await handleJailbrokenWarning()
    await loginRecoverWallet.recoverMnemonicWallet()
  })

  it('should fail', async () => {
    console.log('Test is supposed to pass and you should see this message!')
  })
})
