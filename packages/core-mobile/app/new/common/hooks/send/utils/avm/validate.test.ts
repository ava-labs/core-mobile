import mockAccounts from 'tests/fixtures/accounts.json'
import { convertNativeToTokenWithBalance } from 'services/balance/nativeTokenConverter'
import glacierTokenList from 'tests/fixtures/glacierTokenList.json'
import { NativeTokenBalance } from '@avalabs/glacier-sdk'
import { TokenType, TokenWithBalanceAVM } from '@avalabs/vm-module-types'
import { SendErrorMessage } from '../types'
import { validate } from './validate'

const tokenWithBalance: NativeTokenBalance = {
  ...glacierTokenList[1].tokens[0],
  balance: 0
}

const mockActiveAccount = mockAccounts[0]

const mockNativeTokenWithBalance: TokenWithBalanceAVM = {
  ...convertNativeToTokenWithBalance(tokenWithBalance),
  type: TokenType.NATIVE,
  coingeckoId: '1',
  description: 'description',
  logoUri: 'logoUri',
  balancePerType: {
    locked: 0n,
    unlocked: 0n,
    atomicMemoryLocked: 0n,
    atomicMemoryUnlocked: 0n
  },
  available: 10000n
}

describe('validate avm send', () => {
  it('should succeed when all requirements met', async () => {
    // Fixture addresses use the fuji (testnet) HRP.
    validate({
      address: mockActiveAccount.addressAVM,
      amount: 1000n,
      maxFee: 1n,
      token: mockNativeTokenWithBalance,
      isTestnet: true
    })
  })

  it('should fail for missing network fee', async () => {
    expect(() =>
      validate({
        address: mockActiveAccount.addressAVM,
        amount: 1000n,
        maxFee: 0n,
        token: mockNativeTokenWithBalance,
        isTestnet: true
      })
    ).toThrow(SendErrorMessage.INVALID_NETWORK_FEE)
  })

  it('should fail for invalid address', async () => {
    expect(() =>
      validate({
        address: 'invalidAddress',
        amount: 1000n,
        maxFee: 1n,
        token: mockNativeTokenWithBalance,
        isTestnet: true
      })
    ).toThrow(SendErrorMessage.INVALID_ADDRESS)
  })

  it('should fail when address HRP does not match the active network (M7)', async () => {
    // fuji (testnet) address rejected when the active network is mainnet.
    expect(() =>
      validate({
        address: mockActiveAccount.addressAVM,
        amount: 1000n,
        maxFee: 1n,
        token: mockNativeTokenWithBalance,
        isTestnet: false
      })
    ).toThrow(SendErrorMessage.INVALID_ADDRESS)
  })

  it('should fail when amount is 0', async () => {
    expect(() =>
      validate({
        address: mockActiveAccount.addressAVM,
        amount: 0n,
        maxFee: 1n,
        token: mockNativeTokenWithBalance,
        isTestnet: true
      })
    ).toThrow(SendErrorMessage.AMOUNT_REQUIRED)
  })

  it('should fail when amount is greater than maxAmount', async () => {
    expect(() =>
      validate({
        address: mockActiveAccount.addressAVM,
        amount: 1000n,
        maxFee: 1n,
        token: {
          ...mockNativeTokenWithBalance,
          available: 100n
        },
        isTestnet: true
      })
    ).toThrow(SendErrorMessage.INSUFFICIENT_BALANCE)
  })

  it('should validate against spendableBalance instead of available when provided (CP-13903)', async () => {
    expect(() =>
      validate({
        address: mockActiveAccount.addressAVM,
        amount: 1000n,
        maxFee: 1n,
        token: mockNativeTokenWithBalance, // available: 10000n
        spendableBalance: 100n,
        isTestnet: true
      })
    ).toThrow(SendErrorMessage.INSUFFICIENT_BALANCE)
  })
})
