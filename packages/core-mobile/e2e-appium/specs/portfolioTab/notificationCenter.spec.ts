import warmup from '../../helpers/warmup'
import ncPage from '../../pages/notificationCenter.page'
import cp from '../../pages/commonEls.page'
import txPage from '../../pages/transactions.page'

describe('Notification Center', () => {
  it('[Smoke] Should verify empty state', async () => {
    await warmup()
    await ncPage.tapNotificationIcon()
    await ncPage.verifyEmptyState()
    await cp.dismissBottomSheet()
  })

  it('Should verify balance notification', async () => {
    await txPage.quickSwap()
    await ncPage.tapNotificationIcon()
    await ncPage.verifyBalanceNotification()
  })

  it('Should clear all notifications', async () => {
    await ncPage.tapClearAll()
    await ncPage.verifyEmptyState()
  })
})
