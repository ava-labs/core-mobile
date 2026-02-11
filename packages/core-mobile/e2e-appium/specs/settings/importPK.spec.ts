import settings from '../../pages/settings.page'
import warmup from '../../helpers/warmup'
import common from '../../pages/commonEls.page'

describe('Settings', () => {
  it('Import PK wallet', async () => {
    await warmup()
    await common.goMyWallets()
    await settings.importWalletViaPK(process.env.E2E_PK as string)
    await settings.tapWalletByName('Imported')
    await settings.verifyAccountDetail('Wallet 2', 'Account 1', true, true)
  })

  it('Import PK wallet - can not add an account', async () => {
    await settings.verifyAddAccountDisabled()
  })

  it('Import PK wallet - get a private key', async () => {
    await settings.goToAccountDetail('Wallet 2', 'Account 1')
    await settings.tapShowPrivateKey()
    await settings.enterCurrentPin()
    await settings.verifyShowPrivateKeyScreen(process.env.E2E_PK as string)
  })

  it('Import PK wallet - remove a PK wallet', async () => {
    await settings.tapRemoveAccount()
    await settings.verifyPKWalletRemoved()
  })
})
