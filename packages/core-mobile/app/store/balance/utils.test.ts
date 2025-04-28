import {
  TokenWithBalance,
  NetworkContractToken,
  TokenType
} from '@avalabs/vm-module-types'
import { Erc20TokenBalance } from '@avalabs/glacier-sdk'
import { ChainId, Network } from '@avalabs/core-chains-sdk'
import { queryClient } from 'contexts/ReactQueryProvider'
import {
  isTokenVisible,
  getLocalTokenId,
  getNetworksToFetch,
  getPollingConfig
} from './utils'
import { LocalTokenWithBalance } from './types'

describe('isTokenVisible', () => {
  it('returns true if tokenVisible is true', () => {
    const tokenVisiblity = { '123': true }
    const token = { localId: '123' } as LocalTokenWithBalance
    expect(isTokenVisible(tokenVisiblity, token)).toBe(true)
  })

  it('returns false if tokenVisible is false', () => {
    const tokenVisiblity = { '123': false }
    const token = { localId: '123' } as LocalTokenWithBalance
    expect(isTokenVisible(tokenVisiblity, token)).toBe(false)
  })

  it('returns false if tokenVisible is undefined and isMalicious is true', () => {
    const tokenVisiblity = {}
    const token = {
      localId: '123',
      type: TokenType.ERC20,
      reputation: Erc20TokenBalance.tokenReputation.MALICIOUS
    } as LocalTokenWithBalance
    expect(isTokenVisible(tokenVisiblity, token)).toBe(false)
  })

  it('returns true if tokenVisible is undefined and isMalicious is false', () => {
    const tokenVisiblity = {}
    const token = {
      localId: '123',
      type: TokenType.ERC20,
      reputation: Erc20TokenBalance.tokenReputation.BENIGN
    } as LocalTokenWithBalance
    expect(isTokenVisible(tokenVisiblity, token)).toBe(true)
  })
})

describe('getLocalTokenId', () => {
  it('returns the token address if it exists', () => {
    const token = { address: '0x123', name: 'name', symbol: 'symbol' } as
      | TokenWithBalance
      | NetworkContractToken
    expect(getLocalTokenId(token)).toBe('0x123')
  })
  it('returns the token name and symbol if address does not exist', () => {
    const token = { name: 'name', symbol: 'symbol' } as
      | TokenWithBalance
      | NetworkContractToken
    expect(getLocalTokenId(token)).toBe('namesymbol')
  })
})

describe('getNetworksToFetch', () => {
  const isDeveloperMode = false
  const address = '0x123'
  const enabledNetworks = [
    {
      chainId: ChainId.AVALANCHE_MAINNET_ID,
      name: 'Avalanche',
      isTestnet: false
    },
    { chainId: ChainId.AVALANCHE_P, name: 'Avalanche', isTestnet: false },
    {
      chainId: ChainId.ETHEREUM_HOMESTEAD,
      name: 'Ethereum',
      isTestnet: false
    },
    { chainId: ChainId.BITCOIN, name: 'Bitcoin', isTestnet: false }
  ]
  const additionalNetworks = [
    {
      chainId: 1111,
      isTestnet: false
    },
    { chainId: 1234, isTestnet: false },
    {
      chainId: 4321,
      isTestnet: false
    },
    {
      chainId: ChainId.ETHEREUM_HOMESTEAD,
      isTestnet: false
    }
  ]
  jest.spyOn(queryClient, 'getQueryData').mockReturnValue({
    1111: {
      chainId: 1111,
      isTestnet: false
    },
    1234: {
      chainId: 1234,
      isTestnet: false
    },
    4321: {
      chainId: 4321,
      isTestnet: false
    }
  })

  it('returns the list of networks to fetch based on the current iteration, the enabled networks and the last transacted networks', () => {
    const expectedNetworks = [
      { chainId: ChainId.AVALANCHE_MAINNET_ID, name: 'Avalanche' },
      { chainId: ChainId.AVALANCHE_P, name: 'Avalanche' },
      { chainId: ChainId.ETHEREUM_HOMESTEAD, name: 'Ethereum' },
      { chainId: ChainId.BITCOIN, name: 'Bitcoin' },
      {
        chainId: 1111,
        isTestnet: false
      },
      { chainId: 1234, isTestnet: false },
      {
        chainId: 4321,
        isTestnet: false
      }
    ]
    const networksToFetch = getNetworksToFetch({
      enabledNetworks: enabledNetworks as unknown[] as Network[],
      isDeveloperMode,
      iteration: 0,
      otherNetworksIteration: 0,
      pullPrimaryNetworks: false,
      address
    })
    expect(networksToFetch.map(n => n.chainId).sort()).toEqual(
      expectedNetworks.map(n => n.chainId).sort()
    )
  })

  it('should iterate through the primary networks and non-primary network with intervals', () => {
    const pollingConfig = getPollingConfig({
      isDeveloperMode: false,
      enabledNetworks: enabledNetworks as unknown[] as Network[]
    })
    let iteration = 1
    let otherNetworksIteration = 0
    const allNetworksOperand =
      pollingConfig.allNetworks / pollingConfig.primaryNetworks

    const iterations = [
      [...enabledNetworks, ...additionalNetworks].map(n => n.chainId).sort(),
      [ChainId.AVALANCHE_P],
      [ChainId.ETHEREUM_HOMESTEAD],
      [ChainId.BITCOIN],
      [ChainId.AVALANCHE_MAINNET_ID],
      [1111],
      [ChainId.ETHEREUM_HOMESTEAD],
      [ChainId.BITCOIN],
      [ChainId.AVALANCHE_MAINNET_ID],
      [ChainId.AVALANCHE_P],
      [1234],
      [ChainId.BITCOIN],
      [ChainId.AVALANCHE_MAINNET_ID],
      [ChainId.AVALANCHE_P],
      [ChainId.ETHEREUM_HOMESTEAD],
      [4321]
    ]
    while (otherNetworksIteration < 3) {
      let pullPrimaryNetworks

      if (iteration > 0 && iteration % allNetworksOperand === 0) {
        pullPrimaryNetworks = false
      } else {
        pullPrimaryNetworks = true
      }
      const networks = getNetworksToFetch({
        isDeveloperMode,
        enabledNetworks: enabledNetworks as unknown[] as Network[],
        iteration,
        otherNetworksIteration,
        pullPrimaryNetworks,
        address
      })

      expect(networks.map(n => n.chainId).sort()).toEqual(iterations[iteration])

      iteration += 1

      if (pullPrimaryNetworks === false) {
        otherNetworksIteration += 1
      }
    }
  })
})
