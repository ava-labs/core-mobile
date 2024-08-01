import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { SendServiceEVM } from 'services/send/SendServiceEVM'
import mockAccounts from 'tests/fixtures/accounts.json'
import mockNetworks from 'tests/fixtures/networks.json'
import glacierTokenList from 'tests/fixtures/glacierTokenList.json'
import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import { TokenType } from '@avalabs/vm-module-types'
import { convertNativeToTokenWithBalance } from 'services/balance/nativeTokenConverter'
import { NativeTokenBalance } from '@avalabs/glacier-sdk'
import { SendErrorMessage, SendState } from './types'

const mockEstimateGas = jest.fn()
jest
  .spyOn(JsonRpcBatchInternal.prototype, 'estimateGas')
  .mockImplementation(mockEstimateGas)

describe('validateStateAndCalculateFees', () => {
  const mockActiveAccount = mockAccounts[0]
  const mockNetwork = { ...mockNetworks[1], vmName: NetworkVMType.EVM }
  const serviceToTest = new SendServiceEVM(
    mockNetwork,
    mockActiveAccount.addressC
  )

  afterEach(() => {
    mockEstimateGas.mockClear()
  })

  beforeEach(() => {
    mockEstimateGas.mockImplementation(_ => {
      return new Promise(resolve => {
        resolve(10n)
      })
    })
  })

  const tokenWithBalance: NativeTokenBalance = {
    ...glacierTokenList[1].tokens[0],
    balance: 0
  }
  describe('when sending NFT', () => {
    const token = {
      ...convertNativeToTokenWithBalance(tokenWithBalance),
      type: TokenType.ERC721,
      address: mockActiveAccount.addressC,
      tokenId: 1
    }
    const sendState = {
      token: token,
      address: mockActiveAccount.addressC,
      defaultMaxFeePerGas: 1n,
      gasLimit: 1
    } as SendState

    const params = {
      sendState,
      isMainnet: false,
      fromAddress: mockActiveAccount.addressC
    }

    it('should succeed when all requirements met', async () => {
      const newState = await serviceToTest.validateStateAndCalculateFees(params)

      expect(newState.canSubmit).toBe(true)
    })

    it('should fail for missing address', async () => {
      const newState = await serviceToTest.validateStateAndCalculateFees({
        ...params,
        sendState: { ...params.sendState, address: undefined }
      })

      expect(newState.canSubmit).toBe(false)
      expect(newState.error?.message).toBe(SendErrorMessage.ADDRESS_REQUIRED)
    })

    it('should fail for missing network fee', async () => {
      const newState = await serviceToTest.validateStateAndCalculateFees({
        ...params,
        sendState: { ...sendState, defaultMaxFeePerGas: 0n }
      })

      expect(newState.canSubmit).toBe(false)
      expect(newState.error?.message).toBe(SendErrorMessage.INVALID_NETWORK_FEE)
    })

    it('should fail for missing gas limit', async () => {
      mockEstimateGas.mockImplementationOnce(_ => {
        return new Promise(resolve => {
          resolve(0n)
        })
      })

      const newState = await serviceToTest.validateStateAndCalculateFees({
        ...params,
        sendState: { ...sendState }
      })

      expect(newState.canSubmit).toBe(false)
      expect(newState.error?.message).toBe(SendErrorMessage.INVALID_GAS_LIMIT)
    })

    it('should fail for insufficient balance for network fee', async () => {
      const newState = await serviceToTest.validateStateAndCalculateFees({
        ...params,
        nativeTokenBalance: 0n
      })

      expect(newState.canSubmit).toBe(false)
      expect(newState.error?.message).toBe(
        SendErrorMessage.INSUFFICIENT_BALANCE_FOR_FEE
      )
    })
  })

  describe('when sending native token', () => {
    const token = {
      ...convertNativeToTokenWithBalance(tokenWithBalance),
      type: TokenType.NATIVE,
      address: mockActiveAccount.addressC,
      tokenId: 1,
      balance: 1000n
    }
    const sendState = {
      token: token,
      address: mockActiveAccount.addressC,
      defaultMaxFeePerGas: 1n,
      gasLimit: 1,
      amount: 10n
    } as SendState

    const params = {
      sendState,
      isMainnet: false,
      fromAddress: mockActiveAccount.addressC
    }

    it('should succeed when all requirements met', async () => {
      const newState = await serviceToTest.validateStateAndCalculateFees(params)

      expect(newState.canSubmit).toBe(true)
    })

    it('should fail for missing address', async () => {
      const newState = await serviceToTest.validateStateAndCalculateFees({
        ...params,
        sendState: { ...params.sendState, address: undefined }
      })

      expect(newState.canSubmit).toBe(false)
      expect(newState.error?.message).toBe(SendErrorMessage.ADDRESS_REQUIRED)
    })

    it('should fail for missing network fee', async () => {
      const newState = await serviceToTest.validateStateAndCalculateFees({
        ...params,
        sendState: { ...params.sendState, defaultMaxFeePerGas: 0n }
      })

      expect(newState.canSubmit).toBe(false)
      expect(newState.error?.message).toBe(SendErrorMessage.INVALID_NETWORK_FEE)
    })

    it('should fail for missing gas limit', async () => {
      mockEstimateGas.mockImplementationOnce(_ => {
        return new Promise(resolve => {
          resolve(0n)
        })
      })

      const newState = await serviceToTest.validateStateAndCalculateFees({
        ...params,
        sendState: { ...sendState }
      })

      expect(newState.canSubmit).toBe(false)
      expect(newState.error?.message).toBe(SendErrorMessage.INVALID_GAS_LIMIT)
    })

    it('should fail for missing amount', async () => {
      const newState = await serviceToTest.validateStateAndCalculateFees({
        ...params,
        sendState: { ...params.sendState, amount: undefined }
      })

      expect(newState.canSubmit).toBe(false)
      expect(newState.error?.message).toBe(SendErrorMessage.AMOUNT_REQUIRED)
    })

    it('should fail for insufficent balance', async () => {
      const newState = await serviceToTest.validateStateAndCalculateFees({
        ...params,
        sendState: { ...params.sendState, amount: 100000n }
      })

      expect(newState.canSubmit).toBe(false)
      expect(newState.error?.message).toBe(
        SendErrorMessage.INSUFFICIENT_BALANCE
      )
    })
  })
})
