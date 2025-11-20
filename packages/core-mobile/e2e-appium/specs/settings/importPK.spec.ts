import settings from '../../pages/settings.page'
import warmup from '../../helpers/warmup'
import { actions } from '../../helpers/actions'
import { selectors } from '../../helpers/selectors'

describe('Settings', () => {
  it('Import PK wallet - import a wallet', async () => {
    await warmup()
    await settings.goSettings()
    await settings.importWalletViaPK(process.env.E2E_PK as string)
    await settings.verifyPKWalletImported()
  })

  it('Import PK wallet - can not add an account', async () => {
    await actions.isVisible(selectors.getById(`more_icon__Wallet 1`))
    await actions.isNotVisible(selectors.getById(`more_icon__Wallet 2`))
  })

  it('Import PK wallet - get a private key', async () => {
    await settings.goToAccountDetail(undefined, 'Account 3')
    await settings.tapShowPrivateKey()
    await settings.enterCurrentPin()
    await settings.verifyShowPrivateKeyScreen(process.env.E2E_PK as string)
  })

  it('Import PK wallet - remove a PK wallet', async () => {
    await settings.tapRemoveAccount()
    await settings.verifyPKWalletRemoved()
  })
})
