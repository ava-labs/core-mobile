import warmup from '../../helpers/warmup'
import settingsPage from '../../pages/settings.page'
import commonElsPage from '../../pages/commonEls.page'

describe('Settings', () => {
  it('Currency - Should have USD currency by default', async () => {
    await warmup()
    await settingsPage.goSettings()
    await settingsPage.tapCurrency()
    await settingsPage.verifyCurrencyScreen()
  })

  it('Currency - Should change currency to EUR', async () => {
    await settingsPage.selectCurrency('EUR')
    await settingsPage.tapCurrency()
    await settingsPage.verifyCurrencyScreen('EUR')
    await commonElsPage.goBack()
  })

  it('Currency - Should change currency back to USD', async () => {
    await settingsPage.tapCurrency()
    await settingsPage.selectCurrency('USD')
    await settingsPage.tapCurrency()
    await settingsPage.verifyCurrencyScreen('USD')
  })
})
