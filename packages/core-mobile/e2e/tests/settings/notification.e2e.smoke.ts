import { warmup } from '../../helpers/warmup'
import burgerMenuPage from '../../pages/burgerMenu/burgerMenu.page'
import notificationsPage from '../../pages/burgerMenu/notifications.page'
import commonElsPage from '../../pages/commonEls.page'

describe('Notification setting', () => {
  it('should turn on balance notification when log in', async () => {
    await warmup(false, true)
    await burgerMenuPage.tapBurgerMenuButton()
    await burgerMenuPage.tapNotifications()
    await notificationsPage.verifyNotificationsSwitches(false, true)
    await commonElsPage.tapBackButton()
    await burgerMenuPage.deleteWallet()
  })

  it('should turn off balance notification when log in', async () => {
    await warmup()
    await burgerMenuPage.tapBurgerMenuButton()
    await burgerMenuPage.tapNotifications()
    await notificationsPage.verifyNotificationsSwitches(false, false)
  })
  it('should turn on all notifications', async () => {
    await notificationsPage.tapStakeSwitch()
    await notificationsPage.verifyNotificationsSwitches(true, false)
    await commonElsPage.tapBackButton()
    await burgerMenuPage.tapNotifications()
    await notificationsPage.tapBalanceSwitch()
    await notificationsPage.verifyNotificationsSwitches(true, true)
    await commonElsPage.tapBackButton()
    await burgerMenuPage.tapNotifications()
    await notificationsPage.verifyNotificationsSwitches(true, true)
  })
  it('should turn off all notifications', async () => {
    await notificationsPage.tapStakeSwitch(false)
    await notificationsPage.verifyNotificationsSwitches(false, true)
    await commonElsPage.tapBackButton()
    await burgerMenuPage.tapNotifications()
    await notificationsPage.tapBalanceSwitch(false)
    await notificationsPage.verifyNotificationsSwitches(false, false)
    await commonElsPage.tapBackButton()
    await burgerMenuPage.tapNotifications()
    await notificationsPage.verifyNotificationsSwitches(false, false)
  })
})
