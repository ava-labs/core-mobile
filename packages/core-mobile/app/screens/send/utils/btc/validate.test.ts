import mockAccounts from 'tests/fixtures/accounts.json'
import { SendErrorMessage } from '../types'
import { validate } from './validate'

const mockActiveAccount = mockAccounts[0]

describe('validate btc send', () => {
  it('should succeed when all requirements met', async () => {
    validate({
      toAddress: mockActiveAccount.addressBTC,
      isMainnet: false,
      amount: 1000n,
      maxFee: 1n,
      maxAmount: 10000n
    })
  })

  it('should fail for missing network fee', async () => {
    expect(() =>
      validate({
        toAddress: mockActiveAccount.addressBTC,
        isMainnet: false,
        amount: 1000n,
        maxFee: 0n,
        maxAmount: 10000n
      })
    ).toThrow(SendErrorMessage.INVALID_NETWORK_FEE)
  })

  it('should fail for invalid address', async () => {
    expect(() =>
      validate({
        toAddress: 'invalidAddress',
        isMainnet: false,
        amount: 1000n,
        maxFee: 1n,
        maxAmount: 10000n
      })
    ).toThrow(SendErrorMessage.INVALID_ADDRESS)
  })

  it('should fail when amount is 0', async () => {
    expect(() =>
      validate({
        toAddress: mockActiveAccount.addressBTC,
        isMainnet: false,
        amount: 0n,
        maxFee: 1n,
        maxAmount: 10000n
      })
    ).toThrow(SendErrorMessage.AMOUNT_REQUIRED)
  })

  it('should fail when amount is greater than maxAmount', async () => {
    expect(() =>
      validate({
        toAddress: mockActiveAccount.addressBTC,
        isMainnet: false,
        amount: 100000n,
        maxFee: 1n,
        maxAmount: 10000n
      })
    ).toThrow(SendErrorMessage.INSUFFICIENT_BALANCE)
  })
})
