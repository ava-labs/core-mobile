/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import actions from '../../../helpers/actions'
import { warmup } from '../../../helpers/warmup'
import cp from '../../../pages/commonEls.page'
import cl from '../../../locators/commonEls.loc'
import sp from '../../../pages/settings.page'

describe('Settings - Networks', () => {
  beforeAll(async () => {
    await warmup()
    await sp.goSettings()
    await sp.tapNetworksRow()
  })

  const networks = [
    {
      networkName: cl.cChain,
      networkData: {
        rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
        explorerUrl: 'https://subnets.avax.network/c-chain',
        chainId: '43114',
        tokenSymbol: 'AVAX',
        tokenName: 'Avalanche'
      }
    },
    {
      networkName: cl.pChain,
      networkData: {
        rpcUrl: 'https://api.avax.network',
        explorerUrl: 'https://subnets.avax.network/p-chain',
        chainId: '4503599627370471',
        tokenSymbol: 'AVAX',
        tokenName: 'Avalanche'
      }
    },
    {
      networkName: cl.bitcoin,
      networkData: {
        explorerUrl: 'https://www.blockchain.com/btc',
        chainId: '4503599627370475',
        tokenSymbol: 'BTC',
        tokenName: 'Bitcoin'
      }
    },
    {
      networkName: cl.ethereum,
      networkData: {
        rpcUrl: 'https://proxy-api.avax.network/proxy/infura/mainnet',
        explorerUrl: 'https://routescan.io',
        chainId: '1',
        tokenSymbol: 'ETH',
        tokenName: 'Ether'
      }
    },
    {
      networkName: cl.solana,
      networkData: {
        explorerUrl: 'https://solscan.io/',
        chainId: '4503599627369476',
        tokenSymbol: 'SOL',
        tokenName: 'SOL'
      }
    },
    {
      networkName: cl.xChain,
      networkData: {
        rpcUrl: 'https://api.avax.network',
        explorerUrl: 'https://subnets.avax.network/x-chain',
        chainId: '4503599627370469',
        tokenSymbol: 'AVAX',
        tokenName: 'Avalanche'
      }
    }
  ]

  networks.forEach(({ networkName, networkData }) => {
    it(`should verify ${networkName} details on settings`, async () => {
      await actions.tap(by.id(`network_list__${networkName}`))
      await sp.verifyNetworkDetails(networkName, networkData)
      await cp.goBack()
    })
  })
})
