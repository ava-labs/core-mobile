import { warmup } from '../../helpers/warmup'
import burgerMenuPage from '../../pages/burgerMenu/burgerMenu.page'
import notificationsPage from '../../pages/burgerMenu/notifications.page'

describe('Notification setting', () => {
  it('should turn ON all notifications by default', async () => {
    await warmup()
    await burgerMenuPage.tapBurgerMenuButton()
    await burgerMenuPage.tapNotifications()
    await notificationsPage.verifyAllSwitches()
  })

  const notificationTypes = [
    'Balance',
    'Stake',
    'Market News',
    'Price Alerts',
    'Product Announcements',
    'Special Offers and Promotions'
  ]

  notificationTypes.forEach(notiType => {
    it(`should toggle ${notiType} notification`, async () => {
      await notificationsPage.toggleAndVerify('enabled', notiType)
      await notificationsPage.toggleAndVerify('disabled', notiType)
    })
  })

  it('should turn off all notifications', async () => {
    for (const notiType of notificationTypes) {
      await notificationsPage.toggleAndVerify('enabled', notiType)
    }
    await notificationsPage.verifyAllSwitches('disabled')
  })
})
