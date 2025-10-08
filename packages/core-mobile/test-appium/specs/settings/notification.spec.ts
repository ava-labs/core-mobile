import warmup from '../../helpers/warmup'
import settingsPage from '../../pages/settings.page'

describe('Settings', () => {
  const notiData = {
    Stake: 'Stake complete alerts',
    Balance: 'Wallet balance change alerts',
    'Product announcements': 'Learn about new features and changes',
    'Special offers and promotions': 'Airdrops and promotional offers',
    'Market news': 'News and market information alerts',
    'Price alerts': 'Token price movement alerts',
    'Favorite token alerts': 'Favorite token price movement alerts'
  }

  it('Notifications - should have all notifications enabled by default', async () => {
    await warmup()
    await settingsPage.goSettings()
    await settingsPage.tapNotifications()
    await settingsPage.verifyNotificationsScreen(notiData)
  })

  Object.entries(notiData).forEach(([title]) => {
    it(`Notifications - Should toggle ${title}`, async () => {
      await settingsPage.toggleAndVerify('enabled', title)
      await settingsPage.toggleAndVerify('disabled', title)
    })
  })
})
