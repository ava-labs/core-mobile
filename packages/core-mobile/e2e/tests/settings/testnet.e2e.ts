import { warmup } from '../../helpers/warmup'
import settingsPage from '../../pages/settings.page'

describe('Settings - Testnet', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('Should enable testnet', async () => {
    await settingsPage.switchToTestnet()
    await settingsPage.verifyTestnetMode()
  })

  it('Should enable mainnet', async () => {
    await settingsPage.switchToMainnet()
    await settingsPage.verifyMainnetMode()
  })
})
