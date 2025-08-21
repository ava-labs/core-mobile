/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import actions from '../../../helpers/actions'
import { warmup } from '../../../helpers/warmup'
import cp from '../../../pages/commonEls.page'
import cl from '../../../locators/commonEls.loc'
import sp from '../../../pages/settings.page'
import assertions from '../../../helpers/assertions'

describe('Network Details', () => {
  beforeAll(async () => {
    await warmup()
    await sp.goSettings()
    await sp.tapNetworksRow()
  })

  const networks = [cl.cChain, cl.pChain, cl.bitcoin, cl.ethereum, cl.solana]

  networks.forEach(network => {
    it(`should verify ${network} details on settings`, async () => {
      await assertions.isNotVisible(by.id(`network__${network}_enabled`))
      await assertions.isNotVisible(by.id(`network__${network}_disabled`))
      await actions.tap(by.id(`network_name__${network}`))
      await sp.verifyNetworkDetails(network)
      await cp.goBack()
    })
  })
})
