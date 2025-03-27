import { warmup } from '../../helpers/warmup'
import burgerMenuPage from '../../pages/burgerMenu/burgerMenu.page'
import securityAndPrivacyPage from '../../pages/burgerMenu/securityAndPrivacy.page'
import commonElsPage from '../../pages/commonEls.page'

describe('Settings Core Analytics', () => {
  it('should turn on Core Analytics when log in', async () => {
    await warmup()
    await burgerMenuPage.tapBurgerMenuButton()
    await burgerMenuPage.tapSecurityAndPrivacy()
    await securityAndPrivacyPage.verifyAnalyticsSwitch(true)
    await commonElsPage.tapBackButton()
    await burgerMenuPage.deleteWallet()
  })

  it('should turn off Core Analytics when log in', async () => {
    await warmup()
    await burgerMenuPage.tapBurgerMenuButton()
    await burgerMenuPage.tapSecurityAndPrivacy()
    await securityAndPrivacyPage.verifyAnalyticsSwitch(false)
  })

  it('should persist Core Analystics switch setup', async () => {
    await securityAndPrivacyPage.tapAnalyticsSwitch()
    await securityAndPrivacyPage.verifyAnalyticsSwitch(true)
    await commonElsPage.tapBackButton()
    await burgerMenuPage.tapSecurityAndPrivacy()
    await securityAndPrivacyPage.tapAnalyticsSwitch(false)
    await securityAndPrivacyPage.verifyAnalyticsSwitch(false)
    await commonElsPage.tapBackButton()
    await burgerMenuPage.tapSecurityAndPrivacy()
    await securityAndPrivacyPage.verifyAnalyticsSwitch(false)
  })
})
