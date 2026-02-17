import { TokenType, TokenWithBalance } from '@avalabs/vm-module-types'
import { getTokenAddress } from './getTokenAddress'

describe('getTokenAddress', () => {
  describe('Native tokens', () => {
    it('should return symbol for native token', () => {
      const token: TokenWithBalance = {
        type: TokenType.NATIVE,
        symbol: 'AVAX',
        address: ''
      } as TokenWithBalance

      expect(getTokenAddress(token)).toBe('AVAX')
    })

    it('should return symbol for native SOL token', () => {
      const token: TokenWithBalance = {
        type: TokenType.NATIVE,
        symbol: 'SOL',
        address: ''
      } as TokenWithBalance

      expect(getTokenAddress(token)).toBe('SOL')
    })

    it('should return symbol for native BTC token', () => {
      const token: TokenWithBalance = {
        type: TokenType.NATIVE,
        symbol: 'BTC',
        address: ''
      } as TokenWithBalance

      expect(getTokenAddress(token)).toBe('BTC')
    })
  })

  describe('ERC20/SPL tokens', () => {
    it('should return address for ERC20 token', () => {
      const token: TokenWithBalance = {
        type: TokenType.ERC20,
        symbol: 'USDC',
        address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
      } as TokenWithBalance

      expect(getTokenAddress(token)).toBe(
        '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
      )
    })

    it('should return address for SPL token', () => {
      const token: TokenWithBalance = {
        type: TokenType.ERC20, // SPL tokens might also use this type
        symbol: 'USDC',
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
      } as TokenWithBalance

      expect(getTokenAddress(token)).toBe(
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
      )
    })

    it('should return address for ERC721 token', () => {
      const token: TokenWithBalance = {
        type: TokenType.ERC721,
        symbol: 'NFT',
        address: '0x123456789abcdef123456789abcdef123456789a'
      } as TokenWithBalance

      expect(getTokenAddress(token)).toBe(
        '0x123456789abcdef123456789abcdef123456789a'
      )
    })

    it('should return address for ERC1155 token', () => {
      const token: TokenWithBalance = {
        type: TokenType.ERC1155,
        symbol: 'MULTI',
        address: '0xabcdef123456789abcdef123456789abcdef1234'
      } as TokenWithBalance

      expect(getTokenAddress(token)).toBe(
        '0xabcdef123456789abcdef123456789abcdef1234'
      )
    })
  })

  describe('Edge cases', () => {
    it('should return empty string when token is undefined', () => {
      expect(getTokenAddress(undefined)).toBe('')
    })

    it('should handle token with empty address (native token edge case)', () => {
      const token: TokenWithBalance = {
        type: TokenType.NATIVE,
        symbol: 'ETH',
        address: ''
      } as TokenWithBalance

      expect(getTokenAddress(token)).toBe('ETH')
    })

    it('should handle token with whitespace in symbol', () => {
      const token: TokenWithBalance = {
        type: TokenType.NATIVE,
        symbol: '  AVAX  ',
        address: ''
      } as TokenWithBalance

      expect(getTokenAddress(token)).toBe('  AVAX  ')
    })

    it('should handle ERC20 token with lowercase address', () => {
      const token: TokenWithBalance = {
        type: TokenType.ERC20,
        symbol: 'DAI',
        address: '0x6b175474e89094c44da98b954eedeac495271d0f'
      } as TokenWithBalance

      expect(getTokenAddress(token)).toBe(
        '0x6b175474e89094c44da98b954eedeac495271d0f'
      )
    })

    it('should handle ERC20 token with checksum address', () => {
      const token: TokenWithBalance = {
        type: TokenType.ERC20,
        symbol: 'DAI',
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
      } as TokenWithBalance

      expect(getTokenAddress(token)).toBe(
        '0x6B175474E89094C44Da98b954EedeAC495271d0F'
      )
    })

    it('should handle native token with address property (should still return symbol)', () => {
      const token: TokenWithBalance = {
        type: TokenType.NATIVE,
        symbol: 'AVAX',
        address: '0x0000000000000000000000000000000000000000'
      } as TokenWithBalance

      expect(getTokenAddress(token)).toBe('AVAX')
    })
  })

  describe('Type discrimination', () => {
    it('should correctly differentiate between native and ERC20 tokens', () => {
      const nativeToken: TokenWithBalance = {
        type: TokenType.NATIVE,
        symbol: 'AVAX',
        address: ''
      } as TokenWithBalance

      const erc20Token: TokenWithBalance = {
        type: TokenType.ERC20,
        symbol: 'AVAX',
        address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7'
      } as TokenWithBalance

      expect(getTokenAddress(nativeToken)).toBe('AVAX')
      expect(getTokenAddress(erc20Token)).toBe(
        '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7'
      )
    })
  })
})
