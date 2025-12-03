import warmup from '../../../helpers/warmup'
import txPage from '../../../pages/transactions.page'
import settingsPage from '../../../pages/settings.page'
import bottomTabsPage from '../../../pages/bottomTabs.page'

describe('Stake on Testnet', () => {
  it('should stake your AVAX', async () => {
    await warmup()
    await settingsPage.switchToTestnet()
    await settingsPage.verifyTestnetMode()
    await bottomTabsPage.tapEarnTab()
    await txPage.stake()
  })

  it('should claim your stake rewards', async () => {
    await txPage.claim()
  })
})
