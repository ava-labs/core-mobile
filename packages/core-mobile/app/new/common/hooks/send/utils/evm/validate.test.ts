import mockAccounts from 'tests/fixtures/accounts.json'
import glacierTokenList from 'tests/fixtures/glacierTokenList.json'
import {
  NetworkTokenWithBalance,
  NftTokenWithBalance,
  TokenType,
  TokenWithBalanceERC20
} from '@avalabs/vm-module-types'
import { convertNativeToTokenWithBalance } from 'services/balance/nativeTokenConverter'
import { NativeTokenBalance } from '@avalabs/glacier-sdk'
import { SendErrorMessage } from '../types'
import {
  validateAmount,
  validateBasicInputs,
  validateERC1155,
  validateERC721,
  validateSupportedToken,
  validateFee
} from './validate'

const tokenWithBalance: NativeTokenBalance = {
  ...glacierTokenList[1].tokens[0],
  balance: 0
}

const mockActiveAccount = mockAccounts[0]

const mockNativeTokenWithBalance: NetworkTokenWithBalance = {
  ...convertNativeToTokenWithBalance(tokenWithBalance),
  type: TokenType.NATIVE,
  coingeckoId: '1',
  description: 'description',
  logoUri: 'logoUri',
  balance: 1000n
}

const mockERC20TokenWithBalance: TokenWithBalanceERC20 = {
  ...convertNativeToTokenWithBalance(tokenWithBalance),
  type: TokenType.ERC20,
  address: mockActiveAccount.addressC,
  logoUri: 'logoUri',
  balance: 1000n,
  reputation: null
}

describe('validate evm send', () => {
  describe('validateBasicInputs', () => {
    it('should succeed when all requirements met', async () => {
      validateBasicInputs(
        mockERC20TokenWithBalance,
        mockActiveAccount.addressC,
        1n
      )
      validateERC721(mockNativeTokenWithBalance)
    })

    it('should fail for missing network fee', async () => {
      expect(() =>
        validateBasicInputs(
          mockERC20TokenWithBalance,
          mockActiveAccount.addressC,
          0n
        )
      ).toThrow(SendErrorMessage.INVALID_NETWORK_FEE)
    })

    it('should fail for empty address', async () => {
      expect(() =>
        validateBasicInputs(mockERC20TokenWithBalance, '', 1n)
      ).toThrow(SendErrorMessage.ADDRESS_REQUIRED)
    })

    it('should fail for invalid address', async () => {
      expect(() =>
        validateBasicInputs(mockERC20TokenWithBalance, 'invalidAddress', 1n)
      ).toThrow(SendErrorMessage.INVALID_ADDRESS)
    })

    it('should fail when token is not selected', async () => {
      expect(() =>
        validateBasicInputs(undefined, mockActiveAccount.addressC, 1n)
      ).toThrow(SendErrorMessage.TOKEN_REQUIRED)
    })
  })

  describe('validate Supported Token', () => {
    it('should succeed when token is supported', async () => {
      validateSupportedToken(mockERC20TokenWithBalance)
    })

    it('should fail when token is not supported', async () => {
      expect(() =>
        validateSupportedToken({
          ...mockERC20TokenWithBalance,
          // @ts-ignore
          type: 'unknown'
        })
      ).toThrow(SendErrorMessage.UNSUPPORTED_TOKEN)
    })
  })

  describe('validate ERC721 send', () => {
    const mockERC721TokenWithBalance: NftTokenWithBalance = {
      ...convertNativeToTokenWithBalance(tokenWithBalance),
      type: TokenType.ERC721,
      address: mockActiveAccount.addressC,
      tokenId: '1',
      tokenUri: 'tokenUri',
      logoSmall: 'logoSmall',
      logoUri: 'logoUri',
      collectionName: 'collectionName',
      description: 'description'
    }

    beforeEach(() => {
      validateBasicInputs(
        mockERC721TokenWithBalance,
        mockActiveAccount.addressC,
        1n
      )
      validateSupportedToken(mockERC721TokenWithBalance)
    })
    it('should succeed when all requirements met', async () => {
      validateERC721(mockNativeTokenWithBalance)
    })

    it('should fail for insufficient balance for network fee', async () => {
      expect(() =>
        validateERC721({
          ...mockNativeTokenWithBalance,
          balance: 0n
        })
      ).toThrow(SendErrorMessage.INSUFFICIENT_BALANCE_FOR_FEE)
    })
  })

  describe('validate ERC1155 send', () => {
    const mockERC1155TokenWithBalance: NftTokenWithBalance = {
      ...convertNativeToTokenWithBalance(tokenWithBalance),
      balance: 10n,
      type: TokenType.ERC1155,
      address: mockActiveAccount.addressC,
      tokenId: '1',
      tokenUri: 'tokenUri',
      logoSmall: 'logoSmall',
      logoUri: 'logoUri',
      collectionName: 'collectionName',
      description: 'description'
    }

    beforeEach(() => {
      validateBasicInputs(
        mockERC1155TokenWithBalance,
        mockActiveAccount.addressC,
        1n
      )
      validateSupportedToken(mockERC1155TokenWithBalance)
    })
    it('should succeed when all requirements met', async () => {
      validateERC1155(mockERC1155TokenWithBalance, mockNativeTokenWithBalance)
    })

    it('should fail for insufficient balance', async () => {
      expect(() =>
        validateERC1155(
          { ...mockERC1155TokenWithBalance, balance: 0n },
          {
            ...mockNativeTokenWithBalance
          }
        )
      ).toThrow(SendErrorMessage.INSUFFICIENT_BALANCE)
    })

    it('should fail for insufficient balance for network fee', async () => {
      expect(() =>
        validateERC1155(mockERC1155TokenWithBalance, {
          ...mockNativeTokenWithBalance,
          balance: 0n
        })
      ).toThrow(SendErrorMessage.INSUFFICIENT_BALANCE_FOR_FEE)
    })
  })

  describe('validate native token send', () => {
    beforeEach(() => {
      validateBasicInputs(
        mockNativeTokenWithBalance,
        mockActiveAccount.addressC,
        1n
      )
      validateSupportedToken(mockNativeTokenWithBalance)
    })

    it('should succeed when all requirements met', async () => {
      validateAmount({
        amount: 10n,
        token: mockNativeTokenWithBalance
      })
      validateFee({
        gasLimit: 1n,
        maxFee: 1n,
        amount: 10n,
        nativeToken: mockNativeTokenWithBalance,
        token: mockNativeTokenWithBalance
      })
    })

    it('should fail when amount is greater than token balance', async () => {
      expect(() =>
        validateAmount({
          amount: 10000n,
          token: mockNativeTokenWithBalance
        })
      ).toThrow(SendErrorMessage.INSUFFICIENT_BALANCE)
    })

    it('should fail when totalFee is greater than remaining balance', async () => {
      expect(() =>
        validateFee({
          gasLimit: 10n,
          maxFee: 10n,
          amount: 1000n,
          nativeToken: mockNativeTokenWithBalance,
          token: mockNativeTokenWithBalance
        })
      ).toThrow(SendErrorMessage.INSUFFICIENT_BALANCE_FOR_FEE)
    })

    it('should fail when amount is 0', async () => {
      expect(() =>
        validateAmount({
          amount: 0n,
          token: mockNativeTokenWithBalance
        })
      ).toThrow(SendErrorMessage.AMOUNT_REQUIRED)
    })
  })

  describe('validate ERC20 token send', () => {
    beforeEach(() => {
      validateBasicInputs(
        mockERC20TokenWithBalance,
        mockActiveAccount.addressC,
        1n
      )
      validateSupportedToken(mockNativeTokenWithBalance)
    })

    it('should succeed when all requirements met', async () => {
      validateAmount({
        amount: 10n,
        token: mockERC20TokenWithBalance
      })
      validateFee({
        gasLimit: 1n,
        maxFee: 1n,
        amount: 10n,
        nativeToken: mockNativeTokenWithBalance,
        token: mockERC20TokenWithBalance
      })
    })

    it('should fail when amount is greater than token balance', async () => {
      expect(() =>
        validateAmount({
          amount: 10000n,
          token: mockERC20TokenWithBalance
        })
      ).toThrow(SendErrorMessage.INSUFFICIENT_BALANCE)
    })

    it('should fail when amount is 0', async () => {
      expect(() =>
        validateAmount({
          amount: 0n,
          token: mockERC20TokenWithBalance
        })
      ).toThrow(SendErrorMessage.AMOUNT_REQUIRED)
    })
  })
})
