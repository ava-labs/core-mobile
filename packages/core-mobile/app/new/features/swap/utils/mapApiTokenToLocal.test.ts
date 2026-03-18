/* eslint-disable @typescript-eslint/no-explicit-any */
import { TokenType } from '@avalabs/vm-module-types'
import { ChainId } from '@avalabs/core-chains-sdk'
import { LocalTokenWithBalance } from 'store/balance'
import { ApiToken } from '../types'
import { mapApiTokenToLocal } from './mapApiTokenToLocal'

describe('mapApiTokenToLocal', () => {
  describe('Native tokens', () => {
    it('should map native AVAX token correctly', () => {
      const apiToken: ApiToken = {
        symbol: 'AVAX',
        name: 'Avalanche',
        address: '',
        decimals: 18,
        isNative: true,
        internalId: 'avax-native',
        logoUri: 'https://example.com/avax.png'
      }

      const result = mapApiTokenToLocal(apiToken, ChainId.AVALANCHE_MAINNET_ID)

      expect(result.type).toBe(TokenType.NATIVE)
      if (result.type === TokenType.NATIVE) {
        expect(result.symbol).toBe('AVAX')
        expect(result.name).toBe('Avalanche')
        expect(result.decimals).toBe(18)
        expect(result.localId).toBe('NATIVE-AVAX')
        expect(result.networkChainId).toBe(ChainId.AVALANCHE_MAINNET_ID)
        expect(result.balance).toBe(0n)
        expect(result.balanceDisplayValue).toBe('0')
      }
    })

    it('should handle native SOL token', () => {
      const apiToken: ApiToken = {
        symbol: 'SOL',
        name: 'Solana',
        address: '',
        decimals: 9,
        isNative: true,
        internalId: 'sol-native',
        logoUri: 'https://example.com/sol.png'
      }

      const result = mapApiTokenToLocal(apiToken, ChainId.SOLANA_MAINNET_ID)

      expect(result.type).toBe(TokenType.NATIVE)
      if (result.type === TokenType.NATIVE) {
        expect(result.symbol).toBe('SOL')
        expect(result.decimals).toBe(9)
        expect(result.localId).toBe('NATIVE-SOL')
      }
    })
  })

  describe('ERC20 tokens', () => {
    it('should map ERC20 USDC token correctly', () => {
      const apiToken: ApiToken = {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
        decimals: 6,
        isNative: false,
        internalId: 'usdc-avax-c',
        logoUri: 'https://example.com/usdc.png'
      }

      const result = mapApiTokenToLocal(apiToken, ChainId.AVALANCHE_MAINNET_ID)

      expect(result.type).toBe(TokenType.ERC20)
      if (result.type === TokenType.ERC20) {
        expect(result.symbol).toBe('USDC')
        expect(result.address).toBe(
          '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
        )
        expect(result.localId).toBe(
          '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e'
        )
        expect(result.decimals).toBe(6)
      }
    })

    it('should map ERC20 token on Ethereum', () => {
      const apiToken: ApiToken = {
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        decimals: 18,
        isNative: false,
        internalId: 'dai-ethereum',
        logoUri: 'https://example.com/dai.png'
      }

      const result = mapApiTokenToLocal(apiToken, ChainId.ETHEREUM_HOMESTEAD)

      expect(result.type).toBe(TokenType.ERC20)
      if (result.type === TokenType.ERC20) {
        expect(result.networkChainId).toBe(ChainId.ETHEREUM_HOMESTEAD)
      }
    })
  })

  describe('SPL tokens', () => {
    it('should map SPL token correctly', () => {
      const apiToken: ApiToken = {
        symbol: 'USDC',
        name: 'USD Coin',
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        decimals: 6,
        isNative: false,
        internalId: 'usdc-solana',
        logoUri: 'https://example.com/usdc.png'
      }

      const result = mapApiTokenToLocal(apiToken, ChainId.SOLANA_MAINNET_ID)

      expect(result.type).toBe(TokenType.SPL)
      if (result.type === TokenType.SPL) {
        expect(result.symbol).toBe('USDC')
        expect(result.address).toBe(
          'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
        )
        expect(result.networkChainId).toBe(ChainId.SOLANA_MAINNET_ID)
      }
    })
  })

  describe('Balance integration', () => {
    it('should merge balance data when provided', () => {
      const apiToken: ApiToken = {
        symbol: 'AVAX',
        name: 'Avalanche',
        address: '',
        decimals: 18,
        isNative: true,
        internalId: 'avax-native',
        logoUri: 'https://example.com/avax.png'
      }

      const balanceData: Partial<LocalTokenWithBalance> = {
        balance: 5000000000000000000n, // 5 AVAX
        balanceInCurrency: 250,
        priceInCurrency: 50
      }

      const result = mapApiTokenToLocal(
        apiToken,
        ChainId.AVALANCHE_MAINNET_ID,
        balanceData as LocalTokenWithBalance
      )

      expect(result.type).toBe(TokenType.NATIVE)
      if (result.type === TokenType.NATIVE) {
        expect(result.balance).toBe(5000000000000000000n)
        expect(result.balanceDisplayValue).toBe('5')
        expect(result.balanceInCurrency).toBe(250)
        expect(result.priceInCurrency).toBe(50)
      }
    })

    it('should format balance display correctly for USDC (6 decimals)', () => {
      const apiToken: ApiToken = {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
        decimals: 6,
        isNative: false,
        internalId: 'usdc-avax-c',
        logoUri: 'https://example.com/usdc.png'
      }

      const balanceData: Partial<LocalTokenWithBalance> = {
        balance: 1000000000n, // 1000 USDC
        balanceInCurrency: 1000,
        priceInCurrency: 1
      }

      const result = mapApiTokenToLocal(
        apiToken,
        ChainId.AVALANCHE_MAINNET_ID,
        balanceData as LocalTokenWithBalance
      )

      expect(result.type).toBe(TokenType.ERC20)
      if (result.type === TokenType.ERC20) {
        expect(result.balance).toBe(1000000000n)
        expect(result.balanceDisplayValue).toBe('1000')
        expect(result.balanceInCurrency).toBe(1000)
      }
    })

    it('should use zero balance when no balance data provided', () => {
      const apiToken: ApiToken = {
        symbol: 'AVAX',
        name: 'Avalanche',
        address: '',
        decimals: 18,
        isNative: true,
        internalId: 'avax-native',
        logoUri: 'https://example.com/avax.png'
      }

      const result = mapApiTokenToLocal(apiToken, ChainId.AVALANCHE_MAINNET_ID)

      expect(result.type).toBe(TokenType.NATIVE)
      if (result.type === TokenType.NATIVE) {
        expect(result.balance).toBe(0n)
        expect(result.balanceDisplayValue).toBe('0')
        expect(result.balanceInCurrency).toBe(0)
        expect(result.priceInCurrency).toBe(0)
      }
    })
  })

  describe('Default values and optional fields', () => {
    it('should use default decimals of 18 when not provided', () => {
      const apiToken = {
        symbol: 'TEST',
        name: 'Test Token',
        address: '0x123',
        isNative: false,
        internalId: 'test-token',
        logoUri: 'https://example.com/test.png'
      } as ApiToken

      const result = mapApiTokenToLocal(apiToken, ChainId.AVALANCHE_MAINNET_ID)

      expect(result.type).toBe(TokenType.ERC20)
      if (result.type === TokenType.ERC20) {
        expect(result.decimals).toBe(18)
      }
    })

    it('should handle missing logoUri', () => {
      const apiToken = {
        symbol: 'TEST',
        name: 'Test Token',
        address: '',
        decimals: 18,
        isNative: true,
        internalId: 'test-token'
      } as ApiToken

      const result = mapApiTokenToLocal(apiToken, ChainId.AVALANCHE_MAINNET_ID)

      expect(result.type).toBe(TokenType.NATIVE)
      if (result.type === TokenType.NATIVE) {
        expect(result.logoUri).toBeUndefined()
      }
    })

    it('should set logoUri when provided', () => {
      const apiToken: ApiToken = {
        symbol: 'AVAX',
        name: 'Avalanche',
        address: '',
        decimals: 18,
        isNative: true,
        internalId: 'avax-native',
        logoUri: 'https://example.com/avax.png'
      }

      const result = mapApiTokenToLocal(apiToken, ChainId.AVALANCHE_MAINNET_ID)

      expect(result.type).toBe(TokenType.NATIVE)
      if (result.type === TokenType.NATIVE) {
        expect(result.logoUri).toBe('https://example.com/avax.png')
      }
    })
  })

  describe('Required fields', () => {
    it('should set isDataAccurate to true', () => {
      const apiToken: ApiToken = {
        symbol: 'AVAX',
        name: 'Avalanche',
        address: '',
        decimals: 18,
        isNative: true,
        internalId: 'avax-native',
        logoUri: 'https://example.com/avax.png'
      }

      const result = mapApiTokenToLocal(apiToken, ChainId.AVALANCHE_MAINNET_ID)

      expect(result.type).toBe(TokenType.NATIVE)
      if (result.type === TokenType.NATIVE) {
        expect(result.isDataAccurate).toBe(true)
      }
    })

    it('should set reputation to null', () => {
      const apiToken: ApiToken = {
        symbol: 'AVAX',
        name: 'Avalanche',
        address: '',
        decimals: 18,
        isNative: true,
        internalId: 'avax-native',
        logoUri: 'https://example.com/avax.png'
      }

      const result = mapApiTokenToLocal(apiToken, ChainId.AVALANCHE_MAINNET_ID)

      expect(result.type).toBe(TokenType.NATIVE)
      if (result.type === TokenType.NATIVE) {
        expect((result as any).reputation).toBe(null)
      }
    })

    it('should preserve internalId', () => {
      const apiToken: ApiToken = {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
        decimals: 6,
        isNative: false,
        internalId: 'usdc-avax-c-chain',
        logoUri: 'https://example.com/usdc.png'
      }

      const result = mapApiTokenToLocal(apiToken, ChainId.AVALANCHE_MAINNET_ID)

      expect(result.type).toBe(TokenType.ERC20)
      if (result.type === TokenType.ERC20) {
        expect(result.internalId).toBe('usdc-avax-c-chain')
      }
    })

    it('should set description to same as name', () => {
      const apiToken: ApiToken = {
        symbol: 'AVAX',
        name: 'Avalanche Native Token',
        address: '',
        decimals: 18,
        isNative: true,
        internalId: 'avax-native',
        logoUri: 'https://example.com/avax.png'
      }

      const result = mapApiTokenToLocal(apiToken, ChainId.AVALANCHE_MAINNET_ID)

      expect(result.type).toBe(TokenType.NATIVE)
      if (result.type === TokenType.NATIVE) {
        expect(result.description).toBe('Avalanche Native Token')
      }
    })
  })

  describe('Edge cases', () => {
    it('should handle very large balance', () => {
      const apiToken: ApiToken = {
        symbol: 'TEST',
        name: 'Test Token',
        address: '',
        decimals: 18,
        isNative: true,
        internalId: 'test-token',
        logoUri: 'https://example.com/test.png'
      }

      const balanceData: Partial<LocalTokenWithBalance> = {
        balance: 1000000000000000000000000n // 1 million tokens
      }

      const result = mapApiTokenToLocal(
        apiToken,
        ChainId.AVALANCHE_MAINNET_ID,
        balanceData as LocalTokenWithBalance
      )

      expect(result.type).toBe(TokenType.NATIVE)
      if (result.type === TokenType.NATIVE) {
        expect(result.balance).toBe(1000000000000000000000000n)
        expect(result.balanceDisplayValue).toBe('1000000')
      }
    })

    it('should handle zero balance correctly', () => {
      const apiToken: ApiToken = {
        symbol: 'AVAX',
        name: 'Avalanche',
        address: '',
        decimals: 18,
        isNative: true,
        internalId: 'avax-native',
        logoUri: 'https://example.com/avax.png'
      }

      const balanceData: Partial<LocalTokenWithBalance> = {
        balance: 0n
      }

      const result = mapApiTokenToLocal(
        apiToken,
        ChainId.AVALANCHE_MAINNET_ID,
        balanceData as LocalTokenWithBalance
      )

      expect(result.type).toBe(TokenType.NATIVE)
      if (result.type === TokenType.NATIVE) {
        expect(result.balance).toBe(0n)
        expect(result.balanceDisplayValue).toBe('0')
      }
    })
  })
})
