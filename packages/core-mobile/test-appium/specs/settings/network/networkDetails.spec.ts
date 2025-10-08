import { actions } from '../../../helpers/actions'
import { networks } from '../../../helpers/networks'
import { selectors } from '../../../helpers/selectors'
import warmup from '../../../helpers/warmup'
import common from '../../../pages/commonEls.page'
import settings from '../../../pages/settings.page'

describe('Settings', () => {
  before(async () => {
    await warmup()
    await settings.goSettings()
    await settings.tapNetworks()
  })

  networks.forEach(({ networkName, networkData }) => {
    it(`Network Details - should verify ${networkName} details on settings`, async () => {
      await actions.tap(selectors.getById(`network_list__${networkName}`))
      await settings.verifyNetworkDetails(networkName, networkData)
      await common.goBack()
    })
  })
})
