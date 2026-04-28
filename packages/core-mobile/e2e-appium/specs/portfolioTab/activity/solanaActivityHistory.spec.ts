import warmup from '../../../helpers/warmup'
import portfolio from '../../../pages/portfolio.page'
import settingsPage from '../../../pages/settings.page'
import settings from '../../../locators/settings.loc'
import txPage from '../../../pages/transactions.page'
import txLoc from '../../../locators/transactions.loc'
import commonPage from '../../../pages/commonEls.page'
import common from '../../../locators/commonEls.loc'

describe('Activity history', () => {
  before(async () => {
    await warmup()
    await txPage.send(txLoc.solToken, '0.002')
    await txPage.verifySuccessToast()

    await txPage.swap('SOL', 'JUP', '0.002', txLoc.solana)
    await txPage.verifySuccessToast()
  })

  it('[Solana Send] verify send history on activity tab', async () => {
    await portfolio.verifySendOnActivityTab(
      txLoc.solana,
      '0.002 SOL sent',
      common.mySolanaAddress,
      common.mySolanaAddress2
    )
  })
  it('[Solana Swap] verify swap history on activity tab', async () => {
    await portfolio.verifySwapActivityHistory('0.002 SOL swapped for')
  })

  it('[Solana Send] verify send history on the token detail', async () => {
    await portfolio.verifySendOnTokenDetail(
      txLoc.solana,
      txLoc.solana,
      '0.002 SOL sent',
      common.mySolanaAddress,
      common.mySolanaAddress2
    )
  })

  it('[Solana Swap] verify swap history on the token detail', async () => {
    await portfolio.verifySwapActivityHistory('0.002 SOL swapped for')
    await commonPage.goBack()
  })

  it('[Solana Receive] verify receive history on activity tab', async () => {
    await settingsPage.switchAccount(settings.account2)
    await portfolio.verifySendOnActivityTab(
      txLoc.solana,
      '0.002 SOL received',
      common.mySolanaAddress,
      common.mySolanaAddress2
    )
  })

  it('[Solana Receive] verify receive history on the token detail activity', async () => {
    await portfolio.verifySendOnTokenDetail(
      txLoc.solana,
      txLoc.solana,
      '0.002 SOL received',
      common.mySolanaAddress,
      common.mySolanaAddress2
    )
  })
})
