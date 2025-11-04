import warmup from '../../helpers/warmup'
import txPage from '../../pages/transactions.page'
import commons from '../../pages/commonEls.page'
import settingsPage from '../../pages/settings.page'
import commonLoc from '../../locators/commonEls.loc'
import settingsLoc from '../../locators/settings.loc'

describe('Withdraw', () => {
  it(`should follow withdraw flow for AVAX`, async () => {
    await warmup()
    await txPage.withdraw()
  })

  it('should set locale via Withdraw flow', async () => {
    await txPage.tapWithdraw()

    // set locale via buy flow
    await txPage.verifyLocale(commonLoc.usa, commonLoc.usd)
    await txPage.setLocale(commonLoc.southKorea, commonLoc.hkd)
    await commons.dismissBottomSheet()

    // verify currency on settings
    await settingsPage.goSettings()
    await settingsPage.verifySettingsRow(settingsLoc.currency, commonLoc.hkd)
    await commons.dismissBottomSheet()

    // verify locale and currency on withdraw flow
    await txPage.tapBuy()
    await txPage.verifyLocale(commonLoc.southKorea, commonLoc.hkd)
    await commons.dismissBottomSheet()
  })
})
