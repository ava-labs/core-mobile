/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import { warmup } from '../../helpers/warmup'
import settingsPage from '../../pages/settings.page'
import portfolioPage from '../../pages/portfolio.page'
import commonElsPage from '../../pages/commonEls.page'

describe('Settings - Currency', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('Should have USD currency by default', async () => {
    await portfolioPage.verifyFiatCurrency()
    await settingsPage.goSettings()
    await settingsPage.verifySettingsRow('Currency', 'USD')
  })

  it('Should change currency to EUR', async () => {
    await settingsPage.tapCurrencyRow()
    await settingsPage.verifyCurrencyScreen()
    await settingsPage.selectCurrency('EUR')
    await settingsPage.verifySettingsRow('Currency', 'EUR')
    await settingsPage.tapCurrencyRow()
    await settingsPage.verifyCurrencyScreen('EUR')
    await commonElsPage.dismissBottomSheet()
    await portfolioPage.verifyFiatCurrency('€')
  })

  it('should change currency back to USD', async () => {
    await settingsPage.goSettings()
    await settingsPage.tapCurrencyRow()
    await settingsPage.selectCurrency('USD')
    await settingsPage.verifySettingsRow('Currency', 'USD')
    await commonElsPage.dismissBottomSheet()
    await portfolioPage.verifyFiatCurrency()
  })
})
