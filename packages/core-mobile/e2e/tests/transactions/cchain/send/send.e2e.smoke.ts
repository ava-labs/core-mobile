import { warmup } from '../../../../helpers/warmup'
// import sendLoc from '../../../../locators/send.loc'
// import accountManagePage from '../../../../pages/accountManage.page'
// import activityTabPage from '../../../../pages/activityTab.page'
// import portfolioPage from '../../../../pages/portfolio.page'
// import sendPage from '../../../../pages/send.page'

describe('Send AVAX', () => {
  it('yo', async () => {
    await warmup()
    // await accountManagePage.createSecondAccount()
  })

  // afterAll(async () => {
  //   await accountManagePage.switchToFirstAccount()
  // })

  // it('should send AVAX', async () => {
  //   await sendPage.sendTokenTo2ndAccount(
  //     sendLoc.avaxToken,
  //     sendLoc.sendingAmount
  //   )
  //   await sendPage.verifySuccessToast()
  // })

  // it('should verify the AVAX transaction on activity tab', async () => {
  //   await portfolioPage.goToActivityTab()
  //   await activityTabPage.verifyExistingRow('Send', '-0.00001 AVAX')
  //   await accountManagePage.switchToSecondAccount()
  //   await activityTabPage.verifyExistingRow('Receive', '+0.00001 AVAX')
  // })
})
