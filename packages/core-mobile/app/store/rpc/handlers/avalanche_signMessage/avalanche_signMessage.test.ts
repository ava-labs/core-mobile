import { ethErrors } from 'eth-rpc-errors'
import mockSession from 'tests/fixtures/walletConnect/session.json'
import * as Navigation from 'utils/Navigation'
import { avalancheSignMessageHandler } from 'store/rpc/handlers/avalanche_signMessage/avalanche_signMessage'
import { RpcMethod, RpcProvider } from 'store/rpc/types'
import { AvalancheSignMessageRpcRequest } from 'store/rpc/handlers/avalanche_signMessage/types'
import mockAccounts from 'tests/fixtures/accounts.json'
import { selectActiveAccount } from 'store/account/slice'
import WalletService from 'services/wallet/WalletService'
import NetworkService from 'services/network/NetworkService'
import { WalletType } from 'services/wallet/types'
import WalletSDK from 'utils/WalletSDK'
import { Avalanche } from '@avalabs/wallets-sdk'
import { DEFERRED_RESULT } from '../types'

jest.mock('store/settings/advanced')
jest.mock('utils/Navigation')
const mockNavigate = jest.fn()
jest.spyOn(Navigation, 'navigate').mockImplementation(mockNavigate)

const mockIsDeveloperMode = true
jest.mock('store/settings/advanced', () => {
  const actual = jest.requireActual('store/settings/advanced')
  return {
    ...actual,
    selectIsDeveloperMode: () => mockIsDeveloperMode
  }
})
jest.mock('store/account/slice', () => {
  const actual = jest.requireActual('store/account/slice')
  return {
    ...actual,
    selectActiveAccount: jest.fn()
  }
})

const mockDispatch = jest.fn()
const mockListenerApi = {
  getState: jest.fn(),
  dispatch: mockDispatch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any

jest.spyOn(WalletService, 'signMessage')
const mockedSignMessage = jest.fn()
jest
  .spyOn(Avalanche.SimpleSigner.prototype, 'signMessage')
  .mockImplementation(mockedSignMessage)
;(selectActiveAccount as jest.Mock).mockReturnValue(mockAccounts[0])

const createRequest = (params: unknown): AvalancheSignMessageRpcRequest => {
  return {
    method: RpcMethod.AVALANCHE_SIGN_MESSAGE,
    data: {
      id: 1677366383831712,
      topic: '3a094bf511357e0f48ff266f0b8d5b846fd3f7de4bd0824d976fdf4c5279b261',
      params: {
        request: {
          method: RpcMethod.AVALANCHE_SIGN_MESSAGE,
          params
        },
        chainId: 'eip155:43114'
      }
    },
    peerMeta: mockSession.peer.metadata,
    provider: RpcProvider.WALLET_CONNECT
  }
}

describe('avalanche_signMessage', () => {
  describe('handle', () => {
    it('returns error for invalid params', async () => {
      const requests = [
        createRequest([]),
        createRequest(['test', '0']),
        createRequest(['test', -1]),
        createRequest([0, 'test']),
        createRequest([0, -1]),
        createRequest([0])
      ]

      for (const request of requests) {
        const result = await avalancheSignMessageHandler.handle(
          request,
          mockListenerApi
        )
        expect(result).toEqual({
          success: false,
          error: ethErrors.rpc.invalidParams({
            message: 'avalanche_signMessage param is invalid'
          })
        })
      }
    })

    it('returns result and navigate for valid params', async () => {
      const accountIndex = 0
      const requests = [
        createRequest(['message to sign']),
        createRequest(['message to sign', accountIndex])
      ]

      const params = [
        { message: '6d65737361676520746f207369676e' },
        { message: '6d65737361676520746f207369676e', accountIndex: 0 }
      ]

      for (let i = 0; i < requests.length; i++) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const request = requests[i]!
        const result = await avalancheSignMessageHandler.handle(
          request,
          mockListenerApi
        )
        expect(result).toEqual({
          success: true,
          value: DEFERRED_RESULT
        })
        expect(mockNavigate).toHaveBeenCalledWith({
          name: 'Root.Wallet',
          params: {
            screen: 'ModalScreens.AvalancheSignMessage',
            params: { request, data: params[i] }
          }
        })
      }
    })
  })

  describe('approve', () => {
    it('returns result and navigate for valid params', async () => {
      const accountIndex = 0
      const messageToSign = 'message to sign'
      const messageToSignHex = '6d65737361676520746f207369676e'
      const payloads = [
        {
          request: createRequest([messageToSign, accountIndex]),
          data: {
            message: messageToSignHex,
            accountIndex: accountIndex
          }
        }
      ]

      mockedSignMessage.mockImplementation(async () => {
        return Buffer.from('signed message')
      })

      const results = [{ success: true, value: '5neFU58q1dTrV7uZfgUiULPYH' }]

      await WalletService.init({
        walletType: WalletType.MNEMONIC,
        isLoggingIn: true,
        mnemonic: await WalletSDK.generateMnemonic()
      })
      for (let i = 0; i < payloads.length; i++) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const payload = payloads[i]!
        const result = await avalancheSignMessageHandler.approve(
          payload,
          mockListenerApi
        )
        expect(WalletService.signMessage).toHaveBeenCalledWith({
          rpcMethod: RpcMethod.AVALANCHE_SIGN_MESSAGE,
          data: messageToSignHex,
          accountIndex: accountIndex,
          network: NetworkService.getAvalancheNetworkX(mockIsDeveloperMode)
        })

        expect(
          Avalanche.SimpleSigner.prototype.signMessage
        ).toHaveBeenCalledWith({
          chain: 'X',
          message: messageToSign
        })
        expect(result).toEqual(results[i])
      }
    })
  })
})
