import warmup from '../../helpers/warmup'
import txPage from '../../pages/transactions.page'
import commons from '../../pages/commonEls.page'
import settingsPage from '../../pages/settings.page'
import commonLoc from '../../locators/commonEls.loc'
import settingsLoc from '../../locators/settings.loc'

describe('Buy', () => {
  before(async () => {
    await warmup()
  })

  const buyTokens = ['AVAX', 'USDC', 'ETH', 'BTC', 'SOL']

  buyTokens.forEach(token => {
    it(`should follow buy flow ${token}`, async () => {
      await txPage.buy(token)
    })
  })

  it('should set locale via Buy flow', async () => {
    await txPage.tapBuy()

    // set locale via buy flow
    await txPage.verifyLocale(commonLoc.usa, commonLoc.usd)
    await txPage.setLocale(commonLoc.southKorea, commonLoc.hkd)
    await commons.dismissBottomSheet()

    // verify currency on settings
    await settingsPage.goSettings()
    await settingsPage.verifySettingsRow(settingsLoc.currency, commonLoc.hkd)
    await commons.dismissBottomSheet()

    // verify locale and currency on withdraw flow
    await txPage.tapWithdraw()
    await txPage.verifyLocale(commonLoc.southKorea, commonLoc.hkd)
    await commons.dismissBottomSheet()
  })
})
