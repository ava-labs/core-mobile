import settings from '../../pages/settings.page'
import warmup from '../../helpers/warmup'
import common from '../../pages/commonEls.page'
import { actions } from '../../helpers/actions'

describe('Settings', () => {
  it('Import wallet - Private key wallet is imported', async () => {
    await warmup()
    await common.goMyWallets()
    await settings.importWalletViaPK(process.env.E2E_PK as string)
    await settings.tapWalletByName('Imported')
    await settings.verifyAccountDetail('Wallet 2', 'Account 1', true, true)
  })

  it('Import wallet - Private Key wallet cannot add an account', async () => {
    await settings.verifyAddAccountDisabled()
  })

  it('Import wallet - Private Key wallet can get a private key', async () => {
    await settings.goToAccountDetail('Wallet 2', 'Account 1')
    await settings.tapShowPrivateKey()
    await settings.enterCurrentPin()
    await settings.verifyShowPrivateKeyScreen(process.env.E2E_PK as string)
  })

  it('Import wallet - Private Key wallet can be removed', async () => {
    await settings.tapRemoveAccount()
    await settings.verifyPKWalletRemoved()
  })

  it('Import wallet - Seed Phrase wallet is imported', async () => {
    await settings.importWallet(process.env.E2E_METAMASK_MNEMONIC as string)
    await settings.tapWalletByName('Wallet 2')
    await settings.verifyAccountDetail()
  })

  it('Import wallet - Seed Phrase wallet can add an account', async () => {
    await settings.tapAddAccountBtn('Wallet 2')
    await settings.verifyMyWalletsAccountName('Account 2', 'Wallet 2')
  })

  it('Import wallet - Seed Phrase wallet can get a private key', async () => {
    await settings.goToAccountDetail('Wallet 2', 'Account 2')
    await settings.tapShowPrivateKey()
    await settings.enterCurrentPin()
    await settings.verifyShowPrivateKeyScreen()
  })

  it('Import wallet - Seed Phrase wallet can remove an account', async () => {
    await settings.tapRemoveAccount()
    await settings.verifyMywalletsAccountNameNotVisible('Account 2', 'Wallet 2')
  })

  it('Import wallet - Seed Phrase wallet can be removed', async () => {
    await settings.tapMoreIconByWallet('Wallet 2')
    await settings.tapRemoveWallet()
    await actions.waitForNotVisible(
      settings.manageAccountsWalletName('Wallet 2')
    )
  })
})
