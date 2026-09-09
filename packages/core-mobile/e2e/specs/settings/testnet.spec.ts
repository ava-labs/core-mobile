import settings from '../../pages/settings.page'
import warmup from '../../helpers/warmup'

describe('Settings', () => {
  it('Testnet - Should enable testnet', async () => {
    await warmup()
    await settings.switchToTestnet()
    await settings.verifyTestnetMode()
  })

  it('Testnet - Should enable mainnet', async () => {
    await settings.switchToMainnet()
    await settings.verifyMainnetMode()
  })
})
