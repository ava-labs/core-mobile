import warmup from '../../helpers/warmup'
import txPage from '../../pages/transactions.page'
import commons from '../../pages/commonEls.page'
import settingsPage from '../../pages/settings.page'
import commonLoc from '../../locators/commonEls.loc'
import settingsLoc from '../../locators/settings.loc'
import { actions } from '../../helpers/actions'
import commonElsPage from '../../pages/commonEls.page'

describe('Buy', () => {
  before(async () => {
    await warmup()
  })

  afterEach(async () => {
    if (await actions.getVisible(commonElsPage.bottomSheet)) {
      await commons.dismissBottomSheet()
    }
  })

  const buyTokens = ['AVAX', 'USDC', 'ETH', 'BTC']

  buyTokens.forEach(token => {
    it(`should follow buy flow ${token}`, async () => {
      await txPage.buy(token)
    })
  })

  it('should set locale via Buy flow', async () => {
    await txPage.tapBuy()

    // set locale via buy flow
    await txPage.verifyLocale(commonLoc.usa, commonLoc.usd)
    await txPage.setLocale(commonLoc.uk, commonLoc.euro)
    await commons.dismissBottomSheet()

    // verify currency on settings
    await settingsPage.goSettings()
    await settingsPage.verifySettingsRow(settingsLoc.currency, commonLoc.euro)
  })
})
