/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import actions from '../../../helpers/actions'
import { warmup } from '../../../helpers/warmup'
import cl from '../../../locators/commonEls.loc'
import cp from '../../../pages/commonEls.page'
import sp from '../../../pages/settings.page'
import assertions from '../../../helpers/assertions'

describe('Settings - Networks', () => {
  beforeAll(async () => {
    await warmup()
    await sp.goSettings()
    await sp.tapNetworksRow()
  })

  const networks = [
    cl.cChain,
    cl.xChain,
    cl.pChain,
    cl.bitcoin,
    cl.ethereum,
    cl.solana,
    cl.optimism,
    cl.arbitrum,
    cl.base
  ]
  const enabledByDefault = [cl.optimism, cl.arbitrum, cl.base]
  const IDS = {
    network: (n: string) => by.id(`network_list__${n}`),
    toggleDisabled: (n: string) => by.id(`network_toggle_disabled__${n}`),
    toggleEnabled: (n: string) => by.id(`network_toggle_enabled__${n}`)
  } as const

  it('should verify the default network list', async () => {
    await actions.waitForElement(sp.addNetworkBtn)

    for (const network of networks) {
      await assertions.isVisible(IDS.network(network))

      if (network === cl.xChain) {
        // X chain is disabled by default
        await assertions.isVisible(IDS.toggleDisabled(network))
        await assertions.isNotVisible(IDS.toggleEnabled(network))
      } else if (enabledByDefault.includes(network)) {
        // Optimism, Arbitrum, Base are enabled by default
        await assertions.isNotVisible(IDS.toggleDisabled(network))
        await assertions.isVisible(IDS.toggleEnabled(network))
      } else {
        // Other default networks don't have toggles
        await assertions.isNotVisible(IDS.toggleDisabled(network))
        await assertions.isNotVisible(IDS.toggleEnabled(network))
      }
    }
  })

  it('should search for a L1 network', async () => {
    await actions.setInputText(cp.searchBar, 'Beam L1')
    await actions.waitForElement(by.id('network_list__Beam L1'))
    await actions.setInputText(cp.searchBar, '')
  })

  it('should toggle off the default networks', async () => {
    for (const network of enabledByDefault) {
      await sp.tapNetworkSwitch(network)
    }
    await cp.dismissBottomSheet()
    await actions.tap(cp.filterDropdown)
    await actions.waitForElement(by.text(`${cl.allNetworks}`))
    for (const network of enabledByDefault) {
      await assertions.isNotVisible(by.text(`${network}`))
    }
  })

  it('should toggle ON the default networks', async () => {
    await actions.tapElementAtIndex(by.text('Account 1'), 0)
    await sp.goSettings()
    await sp.tapNetworksRow()

    for (const network of [...enabledByDefault, cl.xChain]) {
      await sp.tapNetworkSwitch(network, false)
    }
    await cp.dismissBottomSheet()
    await actions.tap(cp.filterDropdown)
    await actions.waitForElement(by.text(`${cl.allNetworks}`))
    for (const network of [...enabledByDefault, cl.xChain]) {
      await assertions.isVisible(by.text(`${network}`))
    }
  })
})
