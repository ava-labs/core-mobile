import { ApiToken } from '../types'
import { getLocalTokenIdFromApi } from './getLocalTokenIdFromApi'

describe('getLocalTokenIdFromApi', () => {
  describe('Native tokens', () => {
    it('should create localId with NATIVE prefix for native AVAX token', () => {
      const apiToken: ApiToken = {
        symbol: 'AVAX',
        name: 'Avalanche',
        address: '',
        decimals: 18,
        isNative: true,
        internalId: 'avax-native',
        logoUri: 'https://example.com/avax.png'
      }

      expect(getLocalTokenIdFromApi(apiToken)).toBe('NATIVE-AVAX')
    })

    it('should create localId with NATIVE prefix for native SOL token', () => {
      const apiToken: ApiToken = {
        symbol: 'SOL',
        name: 'Solana',
        address: '',
        decimals: 9,
        isNative: true,
        internalId: 'sol-native',
        logoUri: 'https://example.com/sol.png'
      }

      expect(getLocalTokenIdFromApi(apiToken)).toBe('NATIVE-SOL')
    })

    it('should create localId with NATIVE prefix for native BTC token', () => {
      const apiToken: ApiToken = {
        symbol: 'BTC',
        name: 'Bitcoin',
        address: '',
        decimals: 8,
        isNative: true,
        internalId: 'btc-native',
        logoUri: 'https://example.com/btc.png'
      }

      expect(getLocalTokenIdFromApi(apiToken)).toBe('NATIVE-BTC')
    })

    it('should handle native token with address (should still use NATIVE prefix)', () => {
      const apiToken: ApiToken = {
        symbol: 'ETH',
        name: 'Ethereum',
        address: '0x0000000000000000000000000000000000000000',
        decimals: 18,
        isNative: true,
        internalId: 'eth-native',
        logoUri: 'https://example.com/eth.png'
      }

      expect(getLocalTokenIdFromApi(apiToken)).toBe('NATIVE-ETH')
    })
  })

  describe('ERC20/SPL tokens', () => {
    it('should return lowercase address for ERC20 token', () => {
      const apiToken: ApiToken = {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
        decimals: 6,
        isNative: false,
        internalId: 'usdc-avax-c',
        logoUri: 'https://example.com/usdc.png'
      }

      expect(getLocalTokenIdFromApi(apiToken)).toBe(
        '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e'
      )
    })

    it('should return lowercase address for SPL token', () => {
      const apiToken: ApiToken = {
        symbol: 'USDC',
        name: 'USD Coin',
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        decimals: 6,
        isNative: false,
        internalId: 'usdc-solana',
        logoUri: 'https://example.com/usdc.png'
      }

      expect(getLocalTokenIdFromApi(apiToken)).toBe(
        'epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v'
      )
    })

    it('should handle mixed case addresses (convert to lowercase)', () => {
      const apiToken: ApiToken = {
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        decimals: 18,
        isNative: false,
        internalId: 'dai-ethereum',
        logoUri: 'https://example.com/dai.png'
      }

      expect(getLocalTokenIdFromApi(apiToken)).toBe(
        '0x6b175474e89094c44da98b954eedeac495271d0f'
      )
    })

    it('should handle already lowercase addresses', () => {
      const apiToken: ApiToken = {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        decimals: 18,
        isNative: false,
        internalId: 'weth-ethereum',
        logoUri: 'https://example.com/weth.png'
      }

      expect(getLocalTokenIdFromApi(apiToken)).toBe(
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
      )
    })

    it('should handle uppercase addresses (convert to lowercase)', () => {
      const apiToken: ApiToken = {
        symbol: 'USDT',
        name: 'Tether USD',
        address: '0XDAC17F958D2EE523A2206206994597C13D831EC7',
        decimals: 6,
        isNative: false,
        internalId: 'usdt-ethereum',
        logoUri: 'https://example.com/usdt.png'
      }

      expect(getLocalTokenIdFromApi(apiToken)).toBe(
        '0xdac17f958d2ee523a2206206994597c13d831ec7'
      )
    })
  })

  describe('Case sensitivity', () => {
    it('should ensure case-insensitive comparison by always returning lowercase for non-native', () => {
      const token1: ApiToken = {
        symbol: 'TOKEN',
        name: 'Test Token',
        address: '0xAbCdEf123456789aBcDeF123456789aBcDeF1234',
        decimals: 18,
        isNative: false,
        internalId: 'token-1',
        logoUri: 'https://example.com/token.png'
      }

      const token2: ApiToken = {
        symbol: 'TOKEN',
        name: 'Test Token',
        address: '0xabcdef123456789abcdef123456789abcdef1234',
        decimals: 18,
        isNative: false,
        internalId: 'token-2',
        logoUri: 'https://example.com/token.png'
      }

      // Both should return the same localId (lowercase)
      const id1 = getLocalTokenIdFromApi(token1)
      const id2 = getLocalTokenIdFromApi(token2)

      expect(id1).toBe(id2)
      expect(id1).toBe('0xabcdef123456789abcdef123456789abcdef1234')
    })
  })

  describe('Edge cases', () => {
    it('should handle native token with empty address', () => {
      const apiToken: ApiToken = {
        symbol: 'AVAX',
        name: 'Avalanche',
        address: '',
        decimals: 18,
        isNative: true,
        internalId: 'avax',
        logoUri: 'https://example.com/avax.png'
      }

      expect(getLocalTokenIdFromApi(apiToken)).toBe('NATIVE-AVAX')
    })

    it('should handle symbol with special characters', () => {
      const apiToken: ApiToken = {
        symbol: 'AVAX.e',
        name: 'Avalanche (Bridged)',
        address: '0x123',
        decimals: 18,
        isNative: true,
        internalId: 'avax-bridged',
        logoUri: 'https://example.com/avax.png'
      }

      expect(getLocalTokenIdFromApi(apiToken)).toBe('NATIVE-AVAX.e')
    })

    it('should handle symbol with numbers', () => {
      const apiToken: ApiToken = {
        symbol: 'BTC2.0',
        name: 'Bitcoin 2.0',
        address: '0x456',
        decimals: 8,
        isNative: true,
        internalId: 'btc2',
        logoUri: 'https://example.com/btc.png'
      }

      expect(getLocalTokenIdFromApi(apiToken)).toBe('NATIVE-BTC2.0')
    })

    it('should handle very long address', () => {
      const longAddress = '0x' + 'a'.repeat(40) // EVM address is 40 hex chars + 0x prefix
      const apiToken: ApiToken = {
        symbol: 'LONG',
        name: 'Long Address Token',
        address: longAddress,
        decimals: 18,
        isNative: false,
        internalId: 'long-token',
        logoUri: 'https://example.com/long.png'
      }

      expect(getLocalTokenIdFromApi(apiToken)).toBe(longAddress.toLowerCase())
    })
  })
})
