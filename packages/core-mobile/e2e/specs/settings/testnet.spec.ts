import settings from '../../pages/settings.page'
import warmup, { restartAndUnlock } from '../../helpers/warmup'

describe('Settings', () => {
  before(async () => {
    await warmup()
  })

  after(async () => {
    await restartAndUnlock()
    await settings.ensureMainnet()
  })

  it('Testnet - Should enable testnet', async () => {
    await settings.switchToTestnet()
    await settings.verifyTestnetMode()
  })

  it('Testnet - Should enable mainnet', async () => {
    await settings.switchToMainnet()
    await settings.verifyMainnetMode()
  })
})
