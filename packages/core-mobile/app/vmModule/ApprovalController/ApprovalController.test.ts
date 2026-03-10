import { RpcMethod } from '@avalabs/vm-module-types'
import { RpcRequest } from '@avalabs/vm-module-types'
import AnalyticsService from 'services/analytics/AnalyticsService'
import WalletConnectService from 'services/walletconnectv2/WalletConnectService'
import { isInAppRequest } from 'store/rpc/utils/isInAppRequest'
import { approvalController } from './ApprovalController'

jest.mock('services/analytics/AnalyticsService')
jest.mock('services/walletconnectv2/WalletConnectService')
jest.mock('expo-router')
jest.mock('services/ledger/LedgerService')
jest.mock('services/wallet/WalletService')
jest.mock('services/walletconnectv2/walletConnectCache/walletConnectCache')
jest.mock('features/ledger/utils')
jest.mock('new/routes/store', () => ({
  currentRouteStore: {
    getState: jest.fn().mockReturnValue({ currentRoute: '' })
  }
}))
jest.mock(
  'features/appReview/utils/promptForAppReviewAfterSuccessfulTransaction',
  () => ({
    promptForAppReviewAfterSuccessfulTransaction: jest.fn()
  })
)
jest.mock('new/common/utils/toast', () => ({
  transactionSnackbar: {
    pending: jest.fn(),
    success: jest.fn(),
    error: jest.fn()
  }
}))
jest.mock('store/rpc/utils/isInAppRequest')

// confetti is a global in the app
global.confetti = { restart: jest.fn() } as unknown as typeof global.confetti

const mockIsInAppRequest = isInAppRequest as jest.MockedFunction<
  typeof isInAppRequest
>

const DAPP_URL = 'https://app.uniswap.org'
const DAPP_SESSION_ID = 'wc-topic-abc123'
const TX_HASH = '0xdeadbeef'
const EVM_ADDRESS = '0xcA0E993876152ccA6053eeDFC753092c8cE712D0'

const makeDappRequest = (
  method: RpcMethod,
  chainId = 'eip155:1'
): RpcRequest => ({
  requestId: 'req-1',
  sessionId: DAPP_SESSION_ID,
  method,
  chainId,
  params: {},
  dappInfo: { name: 'Uniswap', url: DAPP_URL, icon: '' }
})

const mockEvmSession = {
  namespaces: {
    eip155: {
      accounts: [`eip155:1:${EVM_ADDRESS}`],
      methods: [],
      events: []
    }
  }
}

describe('ApprovalController', () => {
  beforeEach(() => {
    mockIsInAppRequest.mockReturnValue(false)
    jest
      .spyOn(WalletConnectService, 'getSession')
      .mockReturnValue(mockEvmSession as never)
  })

  describe('onTransactionConfirmed', () => {
    it('fires captureWithEncryption with _confirmed event for dapp requests', () => {
      approvalController.onTransactionConfirmed({
        txHash: TX_HASH,
        explorerLink: 'https://explorer.com/tx/0xdeadbeef',
        request: makeDappRequest(RpcMethod.ETH_SEND_TRANSACTION)
      })

      expect(AnalyticsService.captureWithEncryption).toHaveBeenCalledWith(
        'eth_sendTransaction_confirmed',
        {
          dAppUrl: DAPP_URL,
          address: EVM_ADDRESS,
          chainId: 'eip155:1',
          txHash: TX_HASH
        }
      )
    })

    it('fires correct event name for avalanche_sendTransaction', () => {
      approvalController.onTransactionConfirmed({
        txHash: TX_HASH,
        explorerLink: '',
        request: makeDappRequest(
          RpcMethod.AVALANCHE_SEND_TRANSACTION,
          'eip155:43114'
        )
      })

      expect(AnalyticsService.captureWithEncryption).toHaveBeenCalledWith(
        'avalanche_sendTransaction_confirmed',
        expect.objectContaining({ txHash: TX_HASH })
      )
    })

    it('does NOT fire analytics for in-app requests', () => {
      mockIsInAppRequest.mockReturnValue(true)

      approvalController.onTransactionConfirmed({
        txHash: TX_HASH,
        explorerLink: '',
        request: makeDappRequest(RpcMethod.ETH_SEND_TRANSACTION)
      })

      expect(AnalyticsService.captureWithEncryption).not.toHaveBeenCalled()
    })

    it('selects the account matching request.chainId when session has multiple chains', () => {
      const chain1Address = '0xAAAA'
      const chain137Address = '0xBBBB'
      jest.spyOn(WalletConnectService, 'getSession').mockReturnValue({
        namespaces: {
          eip155: {
            accounts: [
              `eip155:1:${chain1Address}`,
              `eip155:137:${chain137Address}`
            ],
            methods: [],
            events: []
          }
        }
      } as never)

      approvalController.onTransactionConfirmed({
        txHash: TX_HASH,
        explorerLink: '',
        request: makeDappRequest(RpcMethod.ETH_SEND_TRANSACTION, 'eip155:137')
      })

      expect(AnalyticsService.captureWithEncryption).toHaveBeenCalledWith(
        'eth_sendTransaction_confirmed',
        expect.objectContaining({ address: chain137Address })
      )
    })

    it('falls back to first account when no chain match found', () => {
      const firstAddress = '0xFIRST'
      jest.spyOn(WalletConnectService, 'getSession').mockReturnValue({
        namespaces: {
          eip155: {
            accounts: [`eip155:1:${firstAddress}`, 'eip155:5:0xOTHER'],
            methods: [],
            events: []
          }
        }
      } as never)

      approvalController.onTransactionConfirmed({
        txHash: TX_HASH,
        explorerLink: '',
        request: makeDappRequest(RpcMethod.ETH_SEND_TRANSACTION, 'eip155:999')
      })

      expect(AnalyticsService.captureWithEncryption).toHaveBeenCalledWith(
        'eth_sendTransaction_confirmed',
        expect.objectContaining({ address: firstAddress })
      )
    })

    it('extracts address from WalletConnect session namespace', () => {
      const solanaAddress = '9gQmZ7fTTgv5hVScrr9QqT6SpBs7i4cKLDdj4tuae3sW'
      jest.spyOn(WalletConnectService, 'getSession').mockReturnValue({
        namespaces: {
          solana: {
            accounts: [
              `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:${solanaAddress}`
            ],
            methods: [],
            events: []
          }
        }
      } as never)

      approvalController.onTransactionConfirmed({
        txHash: TX_HASH,
        explorerLink: '',
        request: makeDappRequest(
          RpcMethod.SOLANA_SIGN_AND_SEND_TRANSACTION,
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'
        )
      })

      expect(AnalyticsService.captureWithEncryption).toHaveBeenCalledWith(
        'solana_signAndSendTransaction_confirmed',
        expect.objectContaining({ address: solanaAddress })
      )
    })

    it('uses empty string for address when session has no accounts', () => {
      jest.spyOn(WalletConnectService, 'getSession').mockReturnValue({
        namespaces: { eip155: { accounts: [], methods: [], events: [] } }
      } as never)

      approvalController.onTransactionConfirmed({
        txHash: TX_HASH,
        explorerLink: '',
        request: makeDappRequest(RpcMethod.ETH_SEND_TRANSACTION)
      })

      expect(AnalyticsService.captureWithEncryption).toHaveBeenCalledWith(
        'eth_sendTransaction_confirmed',
        expect.objectContaining({ address: '' })
      )
    })

    it('uses empty string for address when session is not found', () => {
      jest
        .spyOn(WalletConnectService, 'getSession')
        .mockReturnValue(undefined as never)

      approvalController.onTransactionConfirmed({
        txHash: TX_HASH,
        explorerLink: '',
        request: makeDappRequest(RpcMethod.ETH_SEND_TRANSACTION)
      })

      expect(AnalyticsService.captureWithEncryption).toHaveBeenCalledWith(
        'eth_sendTransaction_confirmed',
        expect.objectContaining({ address: '' })
      )
    })
  })

  describe('onTransactionReverted', () => {
    it('fires captureWithEncryption with _failed event including txHash for dapp requests', () => {
      approvalController.onTransactionReverted({
        txHash: TX_HASH,
        request: makeDappRequest(RpcMethod.ETH_SEND_TRANSACTION)
      })

      expect(AnalyticsService.captureWithEncryption).toHaveBeenCalledWith(
        'eth_sendTransaction_failed',
        {
          dAppUrl: DAPP_URL,
          address: EVM_ADDRESS,
          chainId: 'eip155:1',
          txHash: TX_HASH
        }
      )
    })

    it('fires bitcoin_sendTransaction_failed for bitcoin reverts', () => {
      const btcAddress = 'tb1qlzsvluv4cahzz8zzwud40x2hn3zq4c7zak6spw'
      jest.spyOn(WalletConnectService, 'getSession').mockReturnValue({
        namespaces: {
          bip122: {
            accounts: [`bip122:000000000019d6689c085ae165831e93:${btcAddress}`],
            methods: [],
            events: []
          }
        }
      } as never)

      approvalController.onTransactionReverted({
        txHash: 'btctxhash',
        request: makeDappRequest(
          RpcMethod.BITCOIN_SEND_TRANSACTION,
          'bip122:000000000019d6689c085ae165831e93'
        )
      })

      expect(AnalyticsService.captureWithEncryption).toHaveBeenCalledWith(
        'bitcoin_sendTransaction_failed',
        expect.objectContaining({
          address: btcAddress,
          txHash: 'btctxhash'
        })
      )
    })

    it('does NOT fire analytics for in-app requests', () => {
      mockIsInAppRequest.mockReturnValue(true)

      approvalController.onTransactionReverted({
        txHash: TX_HASH,
        request: makeDappRequest(RpcMethod.ETH_SEND_TRANSACTION)
      })

      expect(AnalyticsService.captureWithEncryption).not.toHaveBeenCalled()
    })

    it('always includes txHash in _failed payload (matches Extension behavior)', () => {
      approvalController.onTransactionReverted({
        txHash: '0xrevertedtx',
        request: makeDappRequest(
          RpcMethod.SOLANA_SIGN_AND_SEND_TRANSACTION,
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'
        )
      })

      const call = (AnalyticsService.captureWithEncryption as jest.Mock).mock
        .calls[0]
      expect(call[1]).toHaveProperty('txHash', '0xrevertedtx')
    })
  })
})
