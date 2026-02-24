/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChainId } from '@avalabs/core-chains-sdk'
import { TokenType as AppTokenType } from '@avalabs/vm-module-types'
import { TokenType as SdkTokenType } from '@avalabs/unified-asset-transfer'
import { LocalTokenWithBalance } from 'store/balance'
import { NetworkWithCaip2ChainId } from 'store/network'
import { toSwappableAsset, toChain } from './fusionTypeConverters'

describe('fusionTypeConverters', () => {
  describe('toSwappableAsset', () => {
    describe('Native tokens', () => {
      it('should convert native AVAX token correctly', () => {
        const token: LocalTokenWithBalance = {
          type: AppTokenType.NATIVE,
          symbol: 'AVAX',
          name: 'Avalanche',
          decimals: 18
        } as LocalTokenWithBalance

        const result = toSwappableAsset(token)

        expect(result).toEqual({
          type: SdkTokenType.NATIVE,
          symbol: 'AVAX',
          name: 'Avalanche',
          decimals: 18
        })
      })

      it('should convert native SOL token correctly', () => {
        const token: LocalTokenWithBalance = {
          type: AppTokenType.NATIVE,
          symbol: 'SOL',
          name: 'Solana',
          decimals: 9
        } as LocalTokenWithBalance

        const result = toSwappableAsset(token)

        expect(result).toEqual({
          type: SdkTokenType.NATIVE,
          symbol: 'SOL',
          name: 'Solana',
          decimals: 9
        })
      })

      it('should not include address for native tokens', () => {
        const token: LocalTokenWithBalance = {
          type: AppTokenType.NATIVE,
          symbol: 'ETH',
          name: 'Ethereum',
          decimals: 18,
          address: '0x0000000000000000000000000000000000000000'
        } as unknown as LocalTokenWithBalance

        const result = toSwappableAsset(token)

        expect(result).toEqual({
          type: SdkTokenType.NATIVE,
          symbol: 'ETH',
          name: 'Ethereum',
          decimals: 18
        })
        expect('address' in result).toBe(false)
      })
    })

    describe('ERC20 tokens', () => {
      it('should convert ERC20 USDC token correctly', () => {
        const token: LocalTokenWithBalance = {
          type: AppTokenType.ERC20,
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
        } as LocalTokenWithBalance

        const result = toSwappableAsset(token)

        expect(result).toEqual({
          type: SdkTokenType.ERC20,
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
        })
      })

      it('should convert ERC20 token on Ethereum', () => {
        const token: LocalTokenWithBalance = {
          type: AppTokenType.ERC20,
          symbol: 'DAI',
          name: 'Dai Stablecoin',
          decimals: 18,
          address: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
        } as LocalTokenWithBalance

        const result = toSwappableAsset(token)

        expect(result.type).toBe(SdkTokenType.ERC20)
        expect((result as { address: string }).address).toBe(
          '0x6B175474E89094C44Da98b954EedeAC495271d0F'
        )
      })

      it('should throw error for ERC20 token without address', () => {
        const token: LocalTokenWithBalance = {
          type: AppTokenType.ERC20,
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          address: ''
        } as LocalTokenWithBalance

        expect(() => toSwappableAsset(token)).toThrow(
          'ERC20 token must have an address'
        )
      })
    })

    describe('SPL tokens', () => {
      it('should convert SPL token on Solana correctly', () => {
        const token: LocalTokenWithBalance = {
          type: AppTokenType.SPL, // SPL tokens use SPL type on Solana
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
        } as LocalTokenWithBalance

        const result = toSwappableAsset(token)

        expect(result).toEqual({
          type: SdkTokenType.SPL,
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
        })
      })

      it('should throw error for SPL token without address', () => {
        const token: LocalTokenWithBalance = {
          type: AppTokenType.SPL,
          symbol: 'SPL',
          name: 'SPL Token',
          decimals: 9,
          address: ''
        } as LocalTokenWithBalance

        expect(() => toSwappableAsset(token)).toThrow(
          'SPL token must have an address'
        )
      })
    })

    describe('Unsupported token types', () => {
      it('should throw error for ERC721 tokens', () => {
        const token: LocalTokenWithBalance = {
          type: AppTokenType.ERC721,
          symbol: 'NFT',
          name: 'NFT Collection',
          decimals: 0
        } as LocalTokenWithBalance

        expect(() => toSwappableAsset(token)).toThrow(
          'ERC721 tokens are not supported for swaps'
        )
      })

      it('should throw error for ERC1155 tokens', () => {
        const token: LocalTokenWithBalance = {
          type: AppTokenType.ERC1155,
          symbol: 'MULTI',
          name: 'Multi Token',
          decimals: 0
        } as LocalTokenWithBalance

        expect(() => toSwappableAsset(token)).toThrow(
          'ERC1155 tokens are not supported for swaps'
        )
      })
    })

    describe('Validation', () => {
      it('should throw error for token without decimals', () => {
        const token: LocalTokenWithBalance = {
          type: AppTokenType.NATIVE,
          symbol: 'TEST',
          name: 'Test Token'
          // Missing decimals
        } as LocalTokenWithBalance

        expect(() => toSwappableAsset(token)).toThrow(
          'Token must have decimals for swaps'
        )
      })

      it('should throw error for token with non-number decimals', () => {
        const token: LocalTokenWithBalance = {
          type: AppTokenType.NATIVE,
          symbol: 'TEST',
          name: 'Test Token',
          decimals: '18' as any
        } as LocalTokenWithBalance

        expect(() => toSwappableAsset(token)).toThrow(
          'Token must have decimals for swaps'
        )
      })
    })
  })

  describe('toChain', () => {
    describe('Basic conversion', () => {
      it('should convert Avalanche C-Chain network correctly', () => {
        const network: NetworkWithCaip2ChainId = {
          chainId: ChainId.AVALANCHE_MAINNET_ID,
          chainName: 'Avalanche C-Chain',
          caip2ChainId: 'eip155:43114',
          rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
          networkToken: {
            name: 'Avalanche',
            symbol: 'AVAX',
            decimals: 18
          }
        } as NetworkWithCaip2ChainId

        const result = toChain(network)

        expect(result.chainId).toBe('eip155:43114')
        expect(result.chainName).toBe('Avalanche C-Chain')
        expect(result.rpcUrl).toBe('https://api.avax.network/ext/bc/C/rpc')
        expect(result.networkToken).toEqual({
          type: SdkTokenType.NATIVE,
          name: 'Avalanche',
          symbol: 'AVAX',
          decimals: 18
        })
      })

      it('should convert Ethereum network correctly', () => {
        const network: NetworkWithCaip2ChainId = {
          chainId: ChainId.ETHEREUM_HOMESTEAD,
          chainName: 'Ethereum',
          caip2ChainId: 'eip155:1',
          rpcUrl: 'https://eth-mainnet.example.com',
          networkToken: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18
          }
        } as NetworkWithCaip2ChainId

        const result = toChain(network)

        expect(result.chainId).toBe('eip155:1')
        expect(result.chainName).toBe('Ethereum')
        expect(result.networkToken.symbol).toBe('ETH')
      })

      it('should convert Solana network correctly', () => {
        const network: NetworkWithCaip2ChainId = {
          chainId: ChainId.SOLANA_MAINNET_ID,
          chainName: 'Solana',
          caip2ChainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          rpcUrl: 'https://api.mainnet-beta.solana.com',
          networkToken: {
            name: 'Solana',
            symbol: 'SOL',
            decimals: 9
          }
        } as NetworkWithCaip2ChainId

        const result = toChain(network)

        expect(result.chainId).toBe('solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp')
        expect(result.networkToken.symbol).toBe('SOL')
        expect(result.networkToken.decimals).toBe(9)
      })
    })

    describe('Utility addresses', () => {
      it('should include multicall address when available', () => {
        const network: NetworkWithCaip2ChainId = {
          chainId: ChainId.AVALANCHE_MAINNET_ID,
          chainName: 'Avalanche C-Chain',
          caip2ChainId: 'eip155:43114',
          rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
          networkToken: {
            name: 'Avalanche',
            symbol: 'AVAX',
            decimals: 18
          },
          utilityAddresses: {
            multicall: '0xcA11bde05977b3631167028862bE2a173976CA11'
          }
        } as NetworkWithCaip2ChainId

        const result = toChain(network)

        expect(result.utilityAddresses).toEqual({
          multicall: '0xcA11bde05977b3631167028862bE2a173976CA11'
        })
      })

      it('should not include utilityAddresses when not available', () => {
        const network: NetworkWithCaip2ChainId = {
          chainId: ChainId.AVALANCHE_MAINNET_ID,
          chainName: 'Avalanche C-Chain',
          caip2ChainId: 'eip155:43114',
          rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
          networkToken: {
            name: 'Avalanche',
            symbol: 'AVAX',
            decimals: 18
          }
        } as NetworkWithCaip2ChainId

        const result = toChain(network)

        expect(result.utilityAddresses).toBeUndefined()
      })

      it('should not include utilityAddresses when multicall is missing', () => {
        const network: NetworkWithCaip2ChainId = {
          chainId: ChainId.AVALANCHE_MAINNET_ID,
          chainName: 'Avalanche C-Chain',
          caip2ChainId: 'eip155:43114',
          rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
          networkToken: {
            name: 'Avalanche',
            symbol: 'AVAX',
            decimals: 18
          },
          utilityAddresses: {}
        } as NetworkWithCaip2ChainId

        const result = toChain(network)

        expect(result.utilityAddresses).toBeUndefined()
      })
    })

    describe('Validation', () => {
      it('should throw error when caip2ChainId is missing', () => {
        const network: NetworkWithCaip2ChainId = {
          chainId: ChainId.AVALANCHE_MAINNET_ID,
          chainName: 'Avalanche C-Chain',
          caip2ChainId: undefined as any,
          rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
          networkToken: {
            name: 'Avalanche',
            symbol: 'AVAX',
            decimals: 18
          }
        } as NetworkWithCaip2ChainId

        expect(() => toChain(network)).toThrow(
          'Network Avalanche C-Chain is missing caip2Id'
        )
      })

      it('should throw error when caip2ChainId is empty string', () => {
        const network: NetworkWithCaip2ChainId = {
          chainId: ChainId.AVALANCHE_MAINNET_ID,
          chainName: 'Avalanche C-Chain',
          caip2ChainId: '' as any,
          rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
          networkToken: {
            name: 'Avalanche',
            symbol: 'AVAX',
            decimals: 18
          }
        } as NetworkWithCaip2ChainId

        expect(() => toChain(network)).toThrow(
          'Network Avalanche C-Chain is missing caip2Id'
        )
      })
    })

    describe('Network token conversion', () => {
      it('should always convert network token to SDK NATIVE type', () => {
        const network: NetworkWithCaip2ChainId = {
          chainId: ChainId.AVALANCHE_MAINNET_ID,
          chainName: 'Avalanche C-Chain',
          caip2ChainId: 'eip155:43114',
          rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
          networkToken: {
            name: 'Avalanche',
            symbol: 'AVAX',
            decimals: 18
          }
        } as NetworkWithCaip2ChainId

        const result = toChain(network)

        expect(result.networkToken.type).toBe(SdkTokenType.NATIVE)
      })
    })
  })
})
