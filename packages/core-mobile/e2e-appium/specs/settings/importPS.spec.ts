import settings from '../../pages/settings.page'
import warmup from '../../helpers/warmup'
import { actions } from '../../helpers/actions'

describe('Settings', () => {
  it('Import PS wallet - import a wallet', async () => {
    await warmup()
    await settings.goSettings()
    await settings.importWallet(process.env.E2E_METAMASK_MNEMONIC as string)
    await settings.verifyWalletImported()
  })

  it('Import PS wallet - add an account', async () => {
    await settings.tapMoreIconByWallet('Wallet 2')
    await settings.tapAddAccountToThisWallet()
    await actions.waitFor(
      settings.manageAccountsAccountName('Wallet 2', 'Account 4')
    )
  })

  it('Import PS wallet - get a private key', async () => {
    await settings.goToAccountDetail('Wallet 2', 'Account 4')
    await settings.tapShowPrivateKey()
    await settings.enterCurrentPin()
    await settings.verifyShowPrivateKeyScreen()
  })

  it('Import PS wallet - remove an account', async () => {
    await settings.tapRemoveAccount()
    await actions.isNotVisible(
      settings.manageAccountsAccountName('Wallet 2', 'Account 4')
    )
  })

  it('Import PS wallet - remove a wallet', async () => {
    await settings.tapMoreIconByWallet('Wallet 2')
    await settings.tapRemoveWallet()
    await actions.isNotVisible(settings.manageAccountsWalletName('Wallet 2'))
  })
})
