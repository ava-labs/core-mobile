import settings from '../../pages/settings.page'
import warmup from '../../helpers/warmup'
import { actions } from '../../helpers/actions'
import common from '../../pages/commonEls.page'

describe('Settings', () => {
  it('Import PS wallet', async () => {
    await warmup()
    await common.goMyWallets()
    await settings.importWallet(process.env.E2E_METAMASK_MNEMONIC as string)
    await settings.tapWalletByName('Wallet 2')
    await settings.verifyAccountDetail()
  })

  it('Import PS wallet - add an account', async () => {
    await settings.tapAddAccountBtn('Wallet 2')
    await actions.waitFor(
      settings.manageAccountsAccountName('Wallet 2', 'Account 2')
    )
  })

  it('Import PS wallet - get a private key', async () => {
    await settings.goToAccountDetail('Wallet 2', 'Account 2')
    await settings.tapShowPrivateKey()
    await settings.enterCurrentPin()
    await settings.verifyShowPrivateKeyScreen()
  })

  it('Import PS wallet - remove an account', async () => {
    await settings.tapRemoveAccount()
    await actions.waitForNotVisible(
      settings.manageAccountsAccountName('Wallet 2', 'Account 2')
    )
  })

  it('Import PS wallet - remove a wallet', async () => {
    await settings.tapMoreIconByWallet('Wallet 2')
    await settings.tapRemoveWallet()
    await actions.waitForNotVisible(
      settings.manageAccountsWalletName('Wallet 2')
    )
  })
})
