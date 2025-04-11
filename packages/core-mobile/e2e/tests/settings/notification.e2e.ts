/* eslint-disable prettier/prettier */
import { warmup } from '../../helpers/warmup'
import settingsPage from '../../pages/settings.page'

describe('Settings - Notifications', () => {
  
  const notiData = {
    'Stake': 'Staking complete alerts',
    'Balance': 'Wallet balance change alerts',
    'Product Announcements': 'Learn about new features and changes',
    'Market News': 'News and market information alerts',
    'Price Alerts': 'Token price movement alerts',
    'Special Offers and Promotions': 'Airdrops and promotional offers'
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
