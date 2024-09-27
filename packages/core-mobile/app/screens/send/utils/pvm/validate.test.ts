import mockAccounts from 'tests/fixtures/accounts.json'
import { convertNativeToTokenWithBalance } from 'services/balance/nativeTokenConverter'
import glacierTokenList from 'tests/fixtures/glacierTokenList.json'
import { NativeTokenBalance } from '@avalabs/glacier-sdk'
import { TokenType, TokenWithBalancePVM } from '@avalabs/vm-module-types'
import { SendErrorMessage } from '../types'
import { validate } from './validate'

const tokenWithBalance: NativeTokenBalance = {
  ...glacierTokenList[1].tokens[0],
  balance: 0
}

const mockActiveAccount = mockAccounts[0]

const mockNativeTokenWithBalance: TokenWithBalancePVM = {
  ...convertNativeToTokenWithBalance(tokenWithBalance),
  type: TokenType.NATIVE,
  coingeckoId: '1',
  description: 'description',
  logoUri: 'logoUri',
  balance: 10000n,
  balancePerType: {
    lockedStaked: 0,
    lockedStakeable: 0,
    lockedPlatform: 0,
    atomicMemoryLocked: 0,
    atomicMemoryUnlocked: 0,
    unlockedUnstaked: 0,
    unlockedStaked: 0,
    pendingStaked: 0
  }
}

describe('validate pvm send', () => {
  it('should succeed when all requirements met', async () => {
    validate({
      address: mockActiveAccount.addressPVM,
      amount: 1000n,
      maxFee: 1n,
      token: mockNativeTokenWithBalance
    })
  })

  it('should fail for missing network fee', async () => {
    expect(() =>
      validate({
        address: mockActiveAccount.addressPVM,
        amount: 1000n,
        maxFee: 0n,
        token: mockNativeTokenWithBalance
      })
    ).toThrow(SendErrorMessage.INVALID_NETWORK_FEE)
  })

  it('should fail for invalid address', async () => {
    expect(() =>
      validate({
        address: 'invalidAddress',
        amount: 1000n,
        maxFee: 1n,
        token: mockNativeTokenWithBalance
      })
    ).toThrow(SendErrorMessage.INVALID_ADDRESS)
  })

  it('should fail when amount is 0', async () => {
    expect(() =>
      validate({
        address: mockActiveAccount.addressPVM,
        amount: 0n,
        maxFee: 1n,
        token: mockNativeTokenWithBalance
      })
    ).toThrow(SendErrorMessage.AMOUNT_REQUIRED)
  })

  it('should fail when amount is greater than maxAmount', async () => {
    expect(() =>
      validate({
        address: mockActiveAccount.addressPVM,
        amount: 1000n,
        maxFee: 1n,
        token: {
          ...mockNativeTokenWithBalance,
          balance: 100n
        }
      })
    ).toThrow(SendErrorMessage.INSUFFICIENT_BALANCE)
  })
})
