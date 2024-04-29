import { NetworkVMType } from '@avalabs/chains-sdk'
import { SendServiceEVM } from 'services/send/SendServiceEVM'
import mockAccounts from 'tests/fixtures/accounts.json'
import mockNetworks from 'tests/fixtures/networks.json'
import BN from 'bn.js'
import glacierTokenList from 'tests/fixtures/glacierTokenList.json'
import { convertNativeToTokenWithBalance } from 'services/balance/nativeTokenConverter'
import { TokenType } from 'store/balance'
import { JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import { SendErrorMessage, SendState } from './types'

jest
  .spyOn(JsonRpcBatchInternal.prototype, 'estimateGas')
  .mockImplementation(_ => {
    return new Promise(resolve => {
      resolve(10n)
    })
  })

describe('validateStateAndCalculateFees', () => {
  const mockActiveAccount = mockAccounts[0]
  const mockNetwork = { ...mockNetworks[1], vmName: NetworkVMType.EVM }
  const serviceToTest = new SendServiceEVM(
    mockNetwork,
    mockActiveAccount.addressC
  )

  describe('when sending NFT', () => {
    const token = {
      ...convertNativeToTokenWithBalance(glacierTokenList[1].tokens[0]),
      type: TokenType.ERC721,
      address: mockActiveAccount.addressC,
      tokenId: 1
    }
    const sendState = {
      token: token,
      address: mockActiveAccount.addressC,
      maxFeePerGas: 1n,
      maxPriorityFeePerGas: 1n,
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
        sendState: { ...sendState, maxFeePerGas: 0n }
      })

      expect(newState.canSubmit).toBe(false)
      expect(newState.error?.message).toBe(SendErrorMessage.INVALID_NETWORK_FEE)
    })

    it('should fail for insufficent balance for network fee', async () => {
      const newState = await serviceToTest.validateStateAndCalculateFees({
        ...params,
        nativeTokenBalance: new BN(0)
      })

      expect(newState.canSubmit).toBe(false)
      expect(newState.error?.message).toBe(
        SendErrorMessage.INSUFFICIENT_BALANCE_FOR_FEE
      )
    })
  })

  describe('when sending native token', () => {
    const token = {
      ...convertNativeToTokenWithBalance(glacierTokenList[1].tokens[0]),
      type: TokenType.NATIVE,
      address: mockActiveAccount.addressC,
      tokenId: 1,
      balance: new BN(1000)
    }
    const sendState = {
      token: token,
      address: mockActiveAccount.addressC,
      maxFeePerGas: 1n,
      maxPriorityFeePerGas: 1n,
      gasLimit: 1,
      amount: new BN(10)
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
        sendState: { ...params.sendState, maxFeePerGas: 0n }
      })

      expect(newState.canSubmit).toBe(false)
      expect(newState.error?.message).toBe(SendErrorMessage.INVALID_NETWORK_FEE)
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
        sendState: { ...params.sendState, amount: new BN(100000) }
      })

      expect(newState.canSubmit).toBe(false)
      expect(newState.error?.message).toBe(
        SendErrorMessage.INSUFFICIENT_BALANCE
      )
    })
  })
})
