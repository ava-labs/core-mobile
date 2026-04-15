/* eslint-disable @typescript-eslint/no-explicit-any */
import { TokenType as FusionTokenType } from '@avalabs/fusion-sdk'
import { TokenType } from '@avalabs/vm-module-types'
import { ChainId } from '@avalabs/core-chains-sdk'
import type { Asset } from '@avalabs/fusion-sdk'
import type { LocalTokenWithBalance } from 'store/balance'
import { mapSdkAssetToLocal } from './mapSdkAssetToLocal'

describe('mapSdkAssetToLocal', () => {
  describe('ERC20 assets', () => {
    it('maps an ERC20 Asset to LocalTokenWithBalance', () => {
      const asset: Asset = {
        type: FusionTokenType.ERC20,
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
        logoUri: 'https://example.com/usdc.png'
      }

      const result = mapSdkAssetToLocal(asset, ChainId.AVALANCHE_TESTNET_ID)

      expect(result.type).toBe(TokenType.ERC20)
      expect(result.symbol).toBe('USDC')
      expect(result.name).toBe('USD Coin')
      expect(result.decimals).toBe(6)
      expect(result.address).toBe('0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E')
      expect(result.localId).toBe('0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e')
      expect(result.networkChainId).toBe(ChainId.AVALANCHE_TESTNET_ID)
      expect(result.balance).toBe(0n)
      expect(result.balanceInCurrency).toBe(0)
      expect(result.priceInCurrency).toBe(0)
      expect(result.isDataAccurate).toBe(true)
      expect((result as any).reputation).toBe(null)
    })

    it('merges portfolio balance data when provided', () => {
      const asset: Asset = {
        type: FusionTokenType.ERC20,
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
        logoUri: undefined
      }

      const balanceData: Partial<LocalTokenWithBalance> = {
        balance: 1000000000n, // 1000 USDC
        balanceInCurrency: 1000,
        priceInCurrency: 1
      }

      const result = mapSdkAssetToLocal(
        asset,
        ChainId.AVALANCHE_TESTNET_ID,
        balanceData as LocalTokenWithBalance
      )

      expect(result.balance).toBe(1000000000n)
      expect(result.balanceDisplayValue).toBe('1000')
      expect(result.balanceInCurrency).toBe(1000)
      expect(result.priceInCurrency).toBe(1)
    })

    it('sets localId to lowercase address for ERC20', () => {
      const asset: Asset = {
        type: FusionTokenType.ERC20,
        name: 'Token',
        symbol: 'TKN',
        decimals: 18,
        address: '0xABCDEF1234567890',
        logoUri: undefined
      }

      const result = mapSdkAssetToLocal(asset, ChainId.AVALANCHE_TESTNET_ID)

      expect(result.localId).toBe('0xabcdef1234567890')
    })

    it('handles null logoUri', () => {
      const asset: Asset = {
        type: FusionTokenType.ERC20,
        name: 'Token',
        symbol: 'TKN',
        decimals: 18,
        address: '0xabc',
        logoUri: undefined
      }

      const result = mapSdkAssetToLocal(asset, ChainId.AVALANCHE_TESTNET_ID)

      expect(result.logoUri).toBeUndefined()
    })
  })

  describe('Native assets', () => {
    it('maps a NativeAsset to LocalTokenWithBalance with NATIVE type', () => {
      const asset: Asset = {
        type: FusionTokenType.NATIVE,
        name: 'Avalanche',
        symbol: 'AVAX',
        decimals: 18,
        logoUri: 'https://example.com/avax.png'
      }

      const result = mapSdkAssetToLocal(asset, ChainId.AVALANCHE_TESTNET_ID)

      expect(result.type).toBe(TokenType.NATIVE)
      expect(result.symbol).toBe('AVAX')
      expect(result.localId).toBe('NATIVE-avax')
    })
  })
})
