import { warmup } from '../../helpers/warmup'
import bottomTabsPage from '../../pages/bottomTabs.page'

describe('Install latest version of app and login', () => {
  beforeAll(async () => {
    await warmup()
    console.log('Logged in successfully!')
  })

  it('Verify the bottom tabs are displayed', async () => {
    console.log('verifying bottom tabs are visible...')
    await bottomTabsPage.verifyBottomTabs()
  })
})
