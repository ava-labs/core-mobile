/* eslint-disable prettier/prettier */
import { warmup } from '../../helpers/warmup'
import settingsPage from '../../pages/settings.page'

describe('Settings - Notifications', () => {
  
  const notiData = {
    'Stake': 'Stake complete alerts',
    'Balance': 'Wallet balance change alerts',
    'Product Announcements': 'Learn about new features and changes',
    'Special Offers and Promotions': 'Airdrops and promotional offers',
    'Market News': 'News and market information alerts',
    'Price Alerts': 'Token price movement alerts',
    'Favorite token alerts': 'Favorite token price movement alerts'
  }
  
  it('should turn ON all notifications by default', async () => {
    await warmup()
    await settingsPage.goSettings()
    await settingsPage.tapNotifications()
    await settingsPage.verifyNotificationsScreen(notiData)
  })

  Object.entries(notiData).forEach(([title]) => {
    it(`should toggle ${title} notification`, async () => {
      await settingsPage.toggleAndVerify('enabled', title)
      await settingsPage.toggleAndVerify('disabled', title)
    })
  })
})
