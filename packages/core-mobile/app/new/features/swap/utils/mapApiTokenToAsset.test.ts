/* eslint-disable @typescript-eslint/no-explicit-any */
import { TokenType as FusionTokenType } from '@avalabs/fusion-sdk'
import type { ApiToken } from '../types'
import { mapApiTokenToAsset } from './mapApiTokenToAsset'

const baseApiToken = (overrides: Partial<ApiToken> = {}): ApiToken =>
  ({
    symbol: 'TKN',
    name: 'Token',
    address: '',
    decimals: 18,
    isNative: false,
    internalId: 'tkn-eip155-43114',
    logoUri: undefined,
    networkCaip2Id: 'eip155:43114',
    top250Rank: null,
    contractType: 'ERC-20',
    ...overrides
  } as ApiToken)

describe('mapApiTokenToAsset', () => {
  describe('native', () => {
    it('maps native AVAX to a NativeAsset', () => {
      const apiToken = baseApiToken({
        symbol: 'AVAX',
        name: 'Avalanche',
        address: '',
        decimals: 18,
        isNative: true,
        contractType: null,
        logoUri: 'https://example.com/avax.png'
      })

      const asset = mapApiTokenToAsset(apiToken)

      expect(asset).toEqual({
        type: FusionTokenType.NATIVE,
        symbol: 'AVAX',
        name: 'Avalanche',
        decimals: 18,
        logoUri: 'https://example.com/avax.png'
      })
    })

    it('ignores address on native tokens', () => {
      const asset = mapApiTokenToAsset(
        baseApiToken({
          symbol: 'AVAX',
          isNative: true,
          address: '0xshouldbeignored'
        })
      )
      expect(asset?.type).toBe(FusionTokenType.NATIVE)
      expect(asset).not.toHaveProperty('address')
    })
  })

  describe('ERC-20', () => {
    it('maps an EVM ERC-20 to an Erc20Asset', () => {
      const apiToken = baseApiToken({
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
        isNative: false,
        contractType: 'ERC-20',
        networkCaip2Id: 'eip155:43114',
        logoUri: 'https://example.com/usdc.png'
      })

      const asset = mapApiTokenToAsset(apiToken)

      expect(asset).toEqual({
        type: FusionTokenType.ERC20,
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
        logoUri: 'https://example.com/usdc.png'
      })
    })

    it('returns undefined for non-native tokens missing an address', () => {
      const asset = mapApiTokenToAsset(
        baseApiToken({
          symbol: 'BAD',
          isNative: false,
          contractType: 'ERC-20',
          address: ''
        })
      )
      expect(asset).toBeUndefined()
    })

    it('falls back to a default decimals when missing', () => {
      const asset = mapApiTokenToAsset(
        baseApiToken({
          symbol: 'XYZ',
          isNative: false,
          contractType: 'ERC-20',
          address: '0xabc',
          decimals: undefined as any
        })
      )
      expect(asset?.decimals).toBeGreaterThan(0)
    })
  })

  describe('SPL', () => {
    it('maps a token with contractType="SPL" to a SplAsset', () => {
      const mintAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
      const asset = mapApiTokenToAsset(
        baseApiToken({
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          isNative: false,
          contractType: 'SPL',
          address: mintAddress,
          networkCaip2Id: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'
        })
      )

      expect(asset).toEqual({
        type: FusionTokenType.SPL,
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        address: mintAddress,
        logoUri: undefined
      })
    })

    it('treats tokens with a solana: caip2 prefix as SPL even when contractType is null', () => {
      const mintAddress = 'So11111111111111111111111111111111111111112'
      const asset = mapApiTokenToAsset(
        baseApiToken({
          symbol: 'wSOL',
          name: 'Wrapped SOL',
          decimals: 9,
          isNative: false,
          contractType: null,
          address: mintAddress,
          networkCaip2Id: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'
        })
      )
      expect(asset?.type).toBe(FusionTokenType.SPL)
    })
  })
})
