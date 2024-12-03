import assertions from '../../helpers/assertions'
import { handleJailbrokenWarning } from '../../helpers/warmup'
import ExistingRecoveryPhrasePage from '../../pages/existingRecoveryPhrase.page'

describe('Verify version update', () => {
  beforeAll(async () => {
    await handleJailbrokenWarning()
  })

  it('Should verify pin screen is shown', async () => {
    await assertions.isVisible(ExistingRecoveryPhrasePage.forgotPinBtn)
  })
})
