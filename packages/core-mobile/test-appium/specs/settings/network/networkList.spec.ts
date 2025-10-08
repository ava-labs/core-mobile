import { actions } from '../../../helpers/actions'
import { selectors } from '../../../helpers/selectors'
import warmup from '../../../helpers/warmup'
import commonLoc from '../../../locators/commonEls.loc'
import common from '../../../pages/commonEls.page'
import settings from '../../../pages/settings.page'

describe('Settings', () => {
  before(async () => {
    await warmup()
    await settings.goSettings()
    await settings.tapNetworks()
  })

  const networks = [
    commonLoc.cChain,
    commonLoc.xChain,
    commonLoc.pChain,
    commonLoc.bitcoin,
    commonLoc.ethereum,
    commonLoc.solana,
    commonLoc.optimism,
    commonLoc.arbitrum,
    commonLoc.base
  ]
  const enabledByDefault = [
    commonLoc.optimism,
    commonLoc.arbitrum,
    commonLoc.base
  ]
  const IDS = {
    network: (n: string) => selectors.getById(`network_list__${n}`),
    toggleDisabled: (n: string) =>
      selectors.getById(`network_toggle_disabled__${n}`),
    toggleEnabled: (n: string) =>
      selectors.getById(`network_toggle_enabled__${n}`)
  } as const

  it('Network List - should verify the default network list', async () => {
    await actions.waitFor(settings.addNetworkBtn)

    for (const network of networks) {
      await actions.isVisible(IDS.network(network))

      if (network === commonLoc.xChain) {
        // X chain is disabled by default
        await actions.isVisible(IDS.toggleDisabled(network))
        await actions.isNotVisible(IDS.toggleEnabled(network))
      } else if (enabledByDefault.includes(network)) {
        // Optimism, Arbitrum, Base are enabled by default
        await actions.isNotVisible(IDS.toggleDisabled(network))
        await actions.isVisible(IDS.toggleEnabled(network))
      } else {
        // Other default networks don't have toggles
        await actions.isNotVisible(IDS.toggleDisabled(network))
        await actions.isNotVisible(IDS.toggleEnabled(network))
      }
    }
  })

  it('Network List - should search for a L1 network', async () => {
    await actions.type(common.searchBar, 'Beam L1')
    await actions.waitFor(selectors.getById('network_list__Beam L1'))
    await actions.type(common.searchBar, '')
  })

  it('Network List - should toggle off the default networks', async () => {
    for (const network of enabledByDefault) {
      await settings.tapNetworkSwitch(network)
    }
    await common.dismissBottomSheet()
    await actions.tap(common.filterDropdown)
    await actions.waitFor(selectors.getByText(`${commonLoc.allNetworks}`))
    for (const network of enabledByDefault) {
      await actions.isNotVisible(selectors.getByText(`${network}`))
    }
  })

  it('Network List - should toggle ON the default networks', async () => {
    await actions.tap(selectors.getByText('Account 1'))
    await settings.goSettings()
    await settings.tapNetworks()

    for (const network of [...enabledByDefault, commonLoc.xChain]) {
      await settings.tapNetworkSwitch(network, false)
    }
    await common.dismissBottomSheet()
    await actions.tap(common.filterDropdown)
    await actions.waitFor(selectors.getByText(`${commonLoc.allNetworks}`))
    for (const network of [...enabledByDefault, commonLoc.xChain]) {
      await actions.isVisible(selectors.getByText(`${network}`))
    }
  })
})
