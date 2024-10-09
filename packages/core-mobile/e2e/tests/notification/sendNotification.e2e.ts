import { warmup } from '../../helpers/warmup'
import sendLoc from '../../locators/send.loc'
import accountManagePage from '../../pages/accountManage.page'
import notificationsPage from '../../pages/burgerMenu/notifications.page'
import portfolioPage from '../../pages/portfolio.page'
import sendPage from '../../pages/send.page'

describe('Send Notification', () => {
  beforeAll(async () => {
    await warmup(false, true)
    await accountManagePage.createSecondAccount()
  })

  it('should receive send notification', async () => {
    await sendPage.sendTokenTo2ndAccount(
      sendLoc.avaxToken,
      sendLoc.sendingAmount
    )
    await device.sendToHome()
    await notificationsPage.verifyPushNotification()
    await notificationsPage.tapPushNotification()
    await portfolioPage.verifyPorfolioScreen()
  })

  it('should not receive send notification', async () => {
    await notificationsPage.switchBalanceNotification(false)
    await sendPage.sendTokenTo2ndAccount(
      sendLoc.avaxToken,
      sendLoc.sendingAmount
    )
    await device.sendToHome()
    await notificationsPage.verifyNoPushNotification()
    await device.launchApp()
    await portfolioPage.verifyPorfolioScreen()
  })
})
