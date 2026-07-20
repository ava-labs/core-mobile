import { RpcMethod, RpcRequest } from '@avalabs/vm-module-types'
import { AvalancheCaip2ChainId } from '@avalabs/core-chains-sdk'
import { WalletType } from 'services/wallet/types'
import { NavigationPresentationMode } from 'new/common/types'
import { walletConnectCache } from 'services/walletconnectv2/walletConnectCache/walletConnectCache'
import { router } from 'expo-router'
import { currentRouteStore } from 'new/routes/store'
import { isInAppRequest } from 'store/rpc/utils/isInAppRequest'
import { CORE_MOBILE_META, CORE_MOBILE_TOPIC } from 'store/rpc/types'
import { transactionSnackbar } from 'new/common/utils/toast'
import { promptForAppReviewAfterSuccessfulTransaction } from 'features/appReview/utils/promptForAppReviewAfterSuccessfulTransaction'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { getAddressForChainId } from 'store/rpc/handlers/wc_sessionRequest/utils'
import {
  clearRequestSignal,
  setRequestSignal
} from 'store/rpc/utils/inFlightRequestSignals'
import {
  isTxFeedbackEnabled,
  isInAppAvalancheRequest,
  isConfettiEnabled,
  isInAppReview,
  isSuccessToastEnabled,
  isImmediateSentToast,
  showConfetti
} from '../utils/requestContext'
import { isOptimisticConfirmationEnabled } from '../utils/isOptimisticConfirmationEnabled'
import { onApprove } from './onApprove'
import { onReject } from './onReject'
import { evaluateBatchApproval, signBatchRequests } from './quickSwapsBypass'
import { approvalController } from './ApprovalController'

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../utils/requestContext', () => ({
  isTxFeedbackEnabled: jest.fn(() => true),
  isInAppAvalancheRequest: jest.fn(() => false),
  isConfettiEnabled: jest.fn(() => true),
  isInAppReview: jest.fn(() => false),
  isSuccessToastEnabled: jest.fn(() => true),
  isImmediateSentToast: jest.fn(() => false),
  showConfetti: jest.fn()
}))

jest.mock('../utils/isOptimisticConfirmationEnabled', () => ({
  isOptimisticConfirmationEnabled: jest.fn()
}))

jest.mock('store/rpc/utils/isInAppRequest', () => ({
  isInAppRequest: jest.fn(() => false)
}))

jest.mock('new/common/utils/toast', () => ({
  transactionSnackbar: {
    success: jest.fn(),
    pending: jest.fn(),
    error: jest.fn()
  }
}))

jest.mock(
  'features/appReview/utils/promptForAppReviewAfterSuccessfulTransaction',
  () => ({ promptForAppReviewAfterSuccessfulTransaction: jest.fn() })
)

jest.mock('expo-router', () => ({
  router: { navigate: jest.fn(), back: jest.fn(), canGoBack: jest.fn() }
}))
jest.mock('services/ledger/LedgerService', () => ({
  __esModule: true,
  default: { disconnect: jest.fn() }
}))
jest.mock('services/walletconnectv2/WalletConnectService', () => ({
  __esModule: true,
  default: { getSession: jest.fn() }
}))
jest.mock(
  'services/walletconnectv2/walletConnectCache/walletConnectCache',
  () => {
    // `get()` returns whatever `set()` was last called with — mirrors the
    // real single-slot cache closely enough for tests that stash onApprove /
    // onReject via `set` and later invoke them via `get`. Wired once here
    // (not per-test) so it survives the top-level `jest.clearAllMocks()`.
    let lastBatchApprovalParams: unknown
    return {
      walletConnectCache: {
        approvalParams: { set: jest.fn() },
        batchApprovalParams: {
          set: jest.fn(params => {
            lastBatchApprovalParams = params
          }),
          get: jest.fn(() => lastBatchApprovalParams)
        }
      }
    }
  }
)
jest.mock('services/wallet/WalletService', () => ({
  __esModule: true,
  default: { getPublicKeyFor: jest.fn(), sign: jest.fn() }
}))
const mockSetReviewTransactionParams = jest.fn()
jest.mock('features/ledger/store', () => ({
  ledgerParamsStore: {
    getState: jest.fn(() => ({
      setReviewTransactionParams: mockSetReviewTransactionParams
    }))
  }
}))
jest.mock('new/routes/store', () => ({
  currentRouteStore: {
    getState: jest.fn(() => ({
      currentRoute: '',
      topRoute: undefined,
      setCurrentRoute: jest.fn(),
      setTopRoute: jest.fn()
    }))
  }
}))
jest.mock('./onApprove', () => ({ onApprove: jest.fn() }))
jest.mock('./onReject', () => ({ onReject: jest.fn() }))
jest.mock('./utils', () => ({ handleLedgerErrorAndShowAlert: jest.fn() }))
jest.mock('common/consts', () => ({ CONFETTI_DURATION_MS: 3000 }))
jest.mock('services/analytics/AnalyticsService')
jest.mock('store/rpc/handlers/wc_sessionRequest/utils', () => ({
  getAddressForChainId: jest.fn()
}))
// Partial mock: `evaluateBatchApproval` / `signBatchRequests` default to the
// REAL implementation (so the existing validator-driven batch tests below
// keep exercising real decision logic via the mutated `approvalValidators`
// array), but individual tests can override with `.mockResolvedValue(...)`
// to force the manual branch without needing a real validator setup.
jest.mock('./quickSwapsBypass', () => {
  const actual = jest.requireActual('./quickSwapsBypass')
  return {
    ...actual,
    evaluateBatchApproval: jest.fn(actual.evaluateBatchApproval),
    signBatchRequests: jest.fn(actual.signBatchRequests)
  }
})

// ─── Typed mock aliases ────────────────────────────────────────────────────────

const mockIsTxFeedbackEnabled = isTxFeedbackEnabled as jest.Mock
const mockIsInAppAvalancheRequest = isInAppAvalancheRequest as jest.Mock
const mockIsConfettiEnabled = isConfettiEnabled as jest.Mock
const mockIsInAppReview = isInAppReview as jest.Mock
const mockIsSuccessToastEnabled = isSuccessToastEnabled as jest.Mock
const mockIsImmediateSentToast = isImmediateSentToast as jest.Mock
const mockShowConfetti = showConfetti as jest.Mock
const mockIsInAppRequest = isInAppRequest as jest.Mock
const mockIsOptimisticConfirmationEnabled =
  isOptimisticConfirmationEnabled as jest.Mock
const mockOnApprove = onApprove as jest.Mock
const mockOnReject = onReject as jest.Mock
const mockRouter = router as jest.Mocked<typeof router>
const mockCurrentRouteStore = currentRouteStore as jest.Mocked<
  typeof currentRouteStore
>
const mockWalletConnectCacheSet = walletConnectCache.approvalParams
  .set as jest.Mock
const mockGetAddressForChainId = getAddressForChainId as jest.Mock
const mockGetPublicKeyFor = jest.requireMock('services/wallet/WalletService')
  .default.getPublicKeyFor as jest.Mock
const mockDisconnect = jest.requireMock('services/ledger/LedgerService').default
  .disconnect as jest.Mock
const mockGetSession = jest.requireMock(
  'services/walletconnectv2/WalletConnectService'
).default.getSession as jest.Mock

global.confetti = { restart: jest.fn() } as unknown as typeof global.confetti

// ─── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(overrides: Partial<RpcRequest> = {}): RpcRequest {
  return {
    requestId: 'req-1',
    sessionId: 'session-1',
    method: RpcMethod.ETH_SEND_TRANSACTION,
    chainId: 'eip155:43114',
    params: {},
    dappInfo: { name: 'TestDApp', url: 'https://test.example.com', icon: '' },
    context: {},
    ...overrides
  } as unknown as RpcRequest
}

const DAPP_URL = 'https://app.uniswap.org'
const DAPP_SESSION_ID = 'wc-topic-abc123'
const TX_HASH = '0xdeadbeef'
const EVM_ADDRESS = '0xcA0E993876152ccA6053eeDFC753092c8cE712D0'

const makeDappRequest = (method: RpcMethod, chainId = 'eip155:1'): RpcRequest =>
  ({
    requestId: 'req-1',
    sessionId: DAPP_SESSION_ID,
    method,
    chainId,
    params: {},
    dappInfo: { name: 'Uniswap', url: DAPP_URL, icon: '' }
  } as unknown as RpcRequest)

// An injected-browser dApp request: in-app session topic, but a REAL dApp url.
// This is the case CP-13825 fixes — it must count toward MTU analytics.
const makeInjectedDappRequest = (
  method: RpcMethod,
  chainId = 'eip155:1'
): RpcRequest =>
  ({
    requestId: 'req-1',
    sessionId: CORE_MOBILE_TOPIC,
    method,
    chainId,
    params: {},
    dappInfo: { name: 'Uniswap', url: DAPP_URL, icon: '' }
  } as unknown as RpcRequest)

// A wallet-internal request (Send / Swap / Stake): carries CORE_MOBILE_META —
// must NOT count toward dApp MTU analytics.
const makeInternalRequest = (
  method: RpcMethod,
  chainId = 'eip155:1'
): RpcRequest =>
  ({
    requestId: 'req-1',
    sessionId: CORE_MOBILE_TOPIC,
    method,
    chainId,
    params: {},
    dappInfo: {
      name: CORE_MOBILE_META.name,
      url: CORE_MOBILE_META.url,
      icon: ''
    }
  } as unknown as RpcRequest)

const mockAccount = {
  addressC: EVM_ADDRESS,
  addressBTC: 'tb1qlzsvluv4cahzz8zzwud40x2hn3zq4c7zak6spw',
  addressAVM: 'X-avax1abc',
  addressPVM: 'P-avax1abc',
  addressCoreEth: EVM_ADDRESS,
  addressSVM: '9gQmZ7fTTgv5hVScrr9QqT6SpBs7i4cKLDdj4tuae3sW'
} as never

/**
 * Helper: triggers requestApproval → onApprove to populate the signingAddressMap,
 * so that onTransactionConfirmed / onTransactionReverted can read the cached address.
 */
const populateSigningAddressCache = async (
  request: RpcRequest,
  address: string | undefined = EVM_ADDRESS
): Promise<void> => {
  mockGetAddressForChainId.mockReturnValue(address)
  const signingData = { type: 'eth_sendTransaction', data: {} } as never
  const displayData = {} as never
  approvalController.requestApproval({ request, displayData, signingData })
  const { onApprove: capturedOnApprove } =
    mockWalletConnectCacheSet.mock.calls[
      mockWalletConnectCacheSet.mock.calls.length - 1
    ][0]
  await capturedOnApprove({
    walletType: WalletType.MNEMONIC,
    walletId: 'w1',
    network: {},
    account: mockAccount
  })
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('ApprovalController', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsTxFeedbackEnabled.mockReturnValue(true)
    mockIsInAppAvalancheRequest.mockReturnValue(false)
    mockIsConfettiEnabled.mockReturnValue(true)
    mockIsInAppReview.mockReturnValue(false)
    mockIsSuccessToastEnabled.mockReturnValue(true)
    mockIsImmediateSentToast.mockReturnValue(false)
    // Mirror the real isInAppRequest (sessionId === CORE_MOBILE_TOPIC) so the
    // provider discriminator is genuinely driven by each request builder's
    // topic — injected (CORE_MOBILE_TOPIC) → true, WalletConnect → false.
    // Individual tests still override with mockReturnValue where they need a
    // fixed value (e.g. confetti / presentation-mode checks). CP-13825.
    mockIsInAppRequest.mockImplementation(
      (request: RpcRequest) => request.sessionId === CORE_MOBILE_TOPIC
    )
    // Default to post-Helicon (no optimistic UI), matching the steady state
    // this codepath will live in. Tests for the pre-Helicon path opt in.
    mockIsOptimisticConfirmationEnabled.mockResolvedValue(false)
  })

  // ── onTransactionPending ──────────────────────────────────────────────────

  describe('onTransactionPending', () => {
    const pendingArgs = (request: RpcRequest) => ({
      txHash: '0xabc',
      request,
      explorerLink: 'https://example.com'
    })

    it('does nothing when SUPPRESS_TX_FEEDBACK is set', async () => {
      mockIsTxFeedbackEnabled.mockReturnValue(false)

      await approvalController.onTransactionPending(pendingArgs(makeRequest()))

      expect(transactionSnackbar.success).not.toHaveBeenCalled()
      expect(transactionSnackbar.pending).not.toHaveBeenCalled()
      expect(mockShowConfetti).not.toHaveBeenCalled()
    })

    it('shows success toast and confetti for in-app Avalanche requests before Helicon is enabled', async () => {
      mockIsInAppAvalancheRequest.mockReturnValue(true)
      mockIsOptimisticConfirmationEnabled.mockResolvedValue(true)

      await approvalController.onTransactionPending(pendingArgs(makeRequest()))

      expect(transactionSnackbar.success).toHaveBeenCalledWith({
        message: 'Transaction sent'
      })
      expect(mockShowConfetti).toHaveBeenCalledTimes(1)
      expect(transactionSnackbar.pending).not.toHaveBeenCalled()
    })

    it('shows pending toast for in-app Avalanche requests after Helicon is enabled', async () => {
      mockIsInAppAvalancheRequest.mockReturnValue(true)
      mockIsOptimisticConfirmationEnabled.mockResolvedValue(false)
      const request = makeRequest()

      await approvalController.onTransactionPending(pendingArgs(request))

      expect(transactionSnackbar.pending).toHaveBeenCalledWith({
        toastId: request.requestId
      })
      expect(transactionSnackbar.success).not.toHaveBeenCalled()
      expect(mockShowConfetti).not.toHaveBeenCalled()
    })

    it('skips confetti when confetti is disabled for in-app Avalanche requests', async () => {
      mockIsInAppAvalancheRequest.mockReturnValue(true)
      mockIsConfettiEnabled.mockReturnValue(false)
      mockIsOptimisticConfirmationEnabled.mockResolvedValue(true)

      await approvalController.onTransactionPending(pendingArgs(makeRequest()))

      expect(transactionSnackbar.success).toHaveBeenCalled()
      expect(mockShowConfetti).not.toHaveBeenCalled()
    })

    it('shows pending toast for non-Avalanche / non-in-app requests', async () => {
      const request = makeRequest()

      await approvalController.onTransactionPending(pendingArgs(request))

      expect(transactionSnackbar.pending).toHaveBeenCalledWith({
        toastId: request.requestId
      })
      expect(transactionSnackbar.success).not.toHaveBeenCalled()
    })

    it('shows "Transaction sent" immediately when IMMEDIATE_SENT_TOAST is set (e.g. Fusion same-chain swap)', async () => {
      mockIsImmediateSentToast.mockReturnValue(true)

      await approvalController.onTransactionPending(pendingArgs(makeRequest()))

      expect(transactionSnackbar.success).toHaveBeenCalledWith({
        message: 'Transaction sent'
      })
      expect(transactionSnackbar.pending).not.toHaveBeenCalled()
    })
  })

  // ── onTransactionConfirmed ────────────────────────────────────────────────

  describe('onTransactionConfirmed', () => {
    beforeAll(() => jest.useFakeTimers())
    afterAll(() => jest.useRealTimers())

    const confirmedArgs = (request: RpcRequest) => ({
      txHash: '0xabc',
      explorerLink: 'https://example.com',
      request
    })

    it('skips all feedback when SUPPRESS_TX_FEEDBACK is set', async () => {
      mockIsTxFeedbackEnabled.mockReturnValue(false)

      await approvalController.onTransactionConfirmed(
        confirmedArgs(makeRequest())
      )

      expect(transactionSnackbar.success).not.toHaveBeenCalled()
      expect(mockShowConfetti).not.toHaveBeenCalled()
      expect(
        promptForAppReviewAfterSuccessfulTransaction
      ).not.toHaveBeenCalled()
    })

    it('still fires analytics when SUPPRESS_TX_FEEDBACK is set', async () => {
      mockIsTxFeedbackEnabled.mockReturnValue(false)
      const request = makeDappRequest(RpcMethod.ETH_SEND_TRANSACTION)
      await populateSigningAddressCache(request)

      approvalController.onTransactionConfirmed({
        txHash: TX_HASH,
        explorerLink: '',
        request
      })

      expect(AnalyticsService.capture).toHaveBeenCalledWith(
        'eth_sendTransaction_confirmed',
        {
          provider: 'walletConnect',
          encrypted: expect.objectContaining({ txHash: TX_HASH })
        }
      )
    })

    it('schedules app-review prompt when isInAppReview is true', async () => {
      mockIsInAppReview.mockReturnValue(true)

      await approvalController.onTransactionConfirmed(
        confirmedArgs(makeRequest())
      )

      jest.runAllTimers()

      expect(
        promptForAppReviewAfterSuccessfulTransaction
      ).toHaveBeenCalledTimes(1)
    })

    it('does not show success toast for in-app Avalanche requests when optimistic UI fired in pending', async () => {
      // Simulate the full pending->confirmed flow so the cached gate decision
      // is populated by onTransactionPending and read by onTransactionConfirmed.
      mockIsInAppAvalancheRequest.mockReturnValue(true)
      mockIsOptimisticConfirmationEnabled.mockResolvedValue(true)
      const request = makeRequest()

      await approvalController.onTransactionPending({
        txHash: '0xabc',
        request,
        explorerLink: 'https://example.com'
      })
      ;(transactionSnackbar.success as jest.Mock).mockClear()
      ;(mockShowConfetti as jest.Mock).mockClear()

      await approvalController.onTransactionConfirmed(confirmedArgs(request))

      expect(transactionSnackbar.success).not.toHaveBeenCalled()
    })

    it('shows success toast and confetti for in-app Avalanche requests when optimistic UI did not fire in pending', async () => {
      mockIsInAppAvalancheRequest.mockReturnValue(true)
      mockIsInAppRequest.mockReturnValue(true)
      mockIsOptimisticConfirmationEnabled.mockResolvedValue(false)
      const request = makeRequest()
      const explorerLink = 'https://explorer.example.com'

      await approvalController.onTransactionPending({
        txHash: '0xabc',
        request,
        explorerLink
      })
      ;(transactionSnackbar.success as jest.Mock).mockClear()
      ;(transactionSnackbar.pending as jest.Mock).mockClear()
      ;(mockShowConfetti as jest.Mock).mockClear()

      await approvalController.onTransactionConfirmed({
        txHash: '0xabc',
        explorerLink,
        request
      })

      expect(transactionSnackbar.success).toHaveBeenCalledWith({
        explorerLink,
        toastId: request.requestId
      })
      expect(mockShowConfetti).toHaveBeenCalledTimes(1)
    })

    it('skips only the success toast when SUCCESS_TOAST_DISABLED is set (confetti controlled separately)', async () => {
      mockIsSuccessToastEnabled.mockReturnValue(false)
      mockIsInAppRequest.mockReturnValue(true)

      await approvalController.onTransactionConfirmed(
        confirmedArgs(makeRequest())
      )

      expect(transactionSnackbar.success).not.toHaveBeenCalled()
      expect(mockShowConfetti).toHaveBeenCalledTimes(1)
    })

    it('shows success toast with explorerLink for non-Avalanche requests', async () => {
      const request = makeRequest()
      const explorerLink = 'https://explorer.example.com'

      await approvalController.onTransactionConfirmed({
        txHash: '0xabc',
        explorerLink,
        request
      })

      expect(transactionSnackbar.success).toHaveBeenCalledWith({
        explorerLink,
        toastId: request.requestId
      })
    })

    it('shows confetti for in-app non-Avalanche requests when confetti is enabled', async () => {
      mockIsInAppRequest.mockReturnValue(true)

      await approvalController.onTransactionConfirmed(
        confirmedArgs(makeRequest())
      )

      expect(mockShowConfetti).toHaveBeenCalledTimes(1)
    })

    it('skips confetti when confetti is disabled', async () => {
      mockIsInAppRequest.mockReturnValue(true)
      mockIsConfettiEnabled.mockReturnValue(false)

      await approvalController.onTransactionConfirmed(
        confirmedArgs(makeRequest())
      )

      expect(mockShowConfetti).not.toHaveBeenCalled()
    })

    it('skips confetti for non-in-app requests', async () => {
      mockIsInAppRequest.mockReturnValue(false)

      await approvalController.onTransactionConfirmed(
        confirmedArgs(makeRequest())
      )

      expect(mockShowConfetti).not.toHaveBeenCalled()
    })

    describe('dapp analytics', () => {
      it('fires capture with _confirmed event for dapp requests', async () => {
        const request = makeDappRequest(RpcMethod.ETH_SEND_TRANSACTION)
        await populateSigningAddressCache(request)

        approvalController.onTransactionConfirmed({
          txHash: TX_HASH,
          explorerLink: 'https://explorer.com/tx/0xdeadbeef',
          request
        })

        expect(AnalyticsService.capture).toHaveBeenCalledWith(
          'eth_sendTransaction_confirmed',
          {
            provider: 'walletConnect',
            encrypted: {
              dAppUrl: DAPP_URL,
              // EVM address is lowercased to a canonical form (CP-13825)
              address: EVM_ADDRESS.toLowerCase(),
              chainId: 'eip155:1',
              txHash: TX_HASH
            }
          }
        )
      })

      it('fires correct event name for avalanche_sendTransaction', async () => {
        const request = makeDappRequest(
          RpcMethod.AVALANCHE_SEND_TRANSACTION,
          'eip155:43114'
        )
        await populateSigningAddressCache(request)

        approvalController.onTransactionConfirmed({
          txHash: TX_HASH,
          explorerLink: '',
          request
        })

        expect(AnalyticsService.capture).toHaveBeenCalledWith(
          'avalanche_sendTransaction_confirmed',
          {
            provider: 'walletConnect',
            encrypted: expect.objectContaining({ txHash: TX_HASH })
          }
        )
      })

      it('fires correct event for avalanche_sendTransaction with AVAX C-chain chainId', async () => {
        const request = makeDappRequest(
          RpcMethod.AVALANCHE_SEND_TRANSACTION,
          AvalancheCaip2ChainId.C
        )
        await populateSigningAddressCache(request)

        approvalController.onTransactionConfirmed({
          txHash: TX_HASH,
          explorerLink: '',
          request
        })

        expect(AnalyticsService.capture).toHaveBeenCalledWith(
          'avalanche_sendTransaction_confirmed',
          {
            provider: 'walletConnect',
            encrypted: expect.objectContaining({
              chainId: AvalancheCaip2ChainId.C,
              txHash: TX_HASH
            })
          }
        )
      })

      it('does NOT fire analytics for wallet-internal requests (CORE_MOBILE_META)', () => {
        approvalController.onTransactionConfirmed({
          txHash: TX_HASH,
          explorerLink: '',
          request: makeInternalRequest(RpcMethod.ETH_SEND_TRANSACTION)
        })

        expect(AnalyticsService.capture).not.toHaveBeenCalled()
      })

      it('fires analytics for injected dApp requests (in-app topic, real url) — CP-13825', async () => {
        const request = makeInjectedDappRequest(RpcMethod.ETH_SEND_TRANSACTION)
        await populateSigningAddressCache(request)

        approvalController.onTransactionConfirmed({
          txHash: TX_HASH,
          explorerLink: '',
          request
        })

        // regression guard: the signer address is the cached one, not '' —
        // proves the signing-address cache gate (CP-13825 3d) also moved.
        expect(AnalyticsService.capture).toHaveBeenCalledWith(
          'eth_sendTransaction_confirmed',
          {
            provider: 'injected',
            encrypted: {
              dAppUrl: DAPP_URL,
              // EVM address is lowercased to a canonical form (CP-13825)
              address: EVM_ADDRESS.toLowerCase(),
              chainId: 'eip155:1',
              txHash: TX_HASH
            }
          }
        )
      })

      it('emits the actual signer for injected reqs, not the active account (granted non-active) — CP-13825', async () => {
        const NON_ACTIVE_SIGNER = '0xAAAA000000000000000000000000000000000001'
        const request = makeInjectedDappRequest(RpcMethod.ETH_SEND_TRANSACTION)
        // the injected router permits signing with a granted, non-active account;
        // the cached address is the selected signer, which the event must reflect.
        await populateSigningAddressCache(request, NON_ACTIVE_SIGNER)

        approvalController.onTransactionConfirmed({
          txHash: TX_HASH,
          explorerLink: '',
          request
        })

        expect(AnalyticsService.capture).toHaveBeenCalledWith(
          'eth_sendTransaction_confirmed',
          {
            provider: 'injected',
            encrypted: expect.objectContaining({
              address: NON_ACTIVE_SIGNER.toLowerCase()
            })
          }
        )
      })

      it('uses getAddressForChainId to resolve the signing address', async () => {
        const request = makeDappRequest(
          RpcMethod.ETH_SEND_TRANSACTION,
          'eip155:137'
        )
        await populateSigningAddressCache(request, '0xBBBB')

        approvalController.onTransactionConfirmed({
          txHash: TX_HASH,
          explorerLink: '',
          request
        })

        expect(mockGetAddressForChainId).toHaveBeenCalledWith(
          'eip155:137',
          mockAccount
        )
        expect(AnalyticsService.capture).toHaveBeenCalledWith(
          'eth_sendTransaction_confirmed',
          {
            provider: 'walletConnect',
            encrypted: expect.objectContaining({ address: '0xbbbb' })
          }
        )
      })

      it('uses empty string for address when cache has no entry', () => {
        approvalController.onTransactionConfirmed({
          txHash: TX_HASH,
          explorerLink: '',
          request: makeDappRequest(RpcMethod.ETH_SEND_TRANSACTION)
        })

        expect(AnalyticsService.capture).toHaveBeenCalledWith(
          'eth_sendTransaction_confirmed',
          {
            provider: 'walletConnect',
            encrypted: expect.objectContaining({ address: '' })
          }
        )
      })

      it('cleans up cached address after use', async () => {
        const request = makeDappRequest(RpcMethod.ETH_SEND_TRANSACTION)
        await populateSigningAddressCache(request)

        // First call uses the cached address
        approvalController.onTransactionConfirmed({
          txHash: TX_HASH,
          explorerLink: '',
          request
        })

        expect(AnalyticsService.capture).toHaveBeenCalledWith(
          'eth_sendTransaction_confirmed',
          {
            provider: 'walletConnect',
            encrypted: expect.objectContaining({
              address: EVM_ADDRESS.toLowerCase()
            })
          }
        )

        // Second call should get empty string (cache was cleaned up)
        ;(AnalyticsService.capture as jest.Mock).mockClear()
        approvalController.onTransactionConfirmed({
          txHash: TX_HASH,
          explorerLink: '',
          request
        })

        expect(AnalyticsService.capture).toHaveBeenCalledWith(
          'eth_sendTransaction_confirmed',
          {
            provider: 'walletConnect',
            encrypted: expect.objectContaining({ address: '' })
          }
        )
      })

      it('does not cache signing address for wallet-internal requests (CORE_MOBILE_META)', async () => {
        const request = makeInternalRequest(RpcMethod.ETH_SEND_TRANSACTION)

        const signingData = { type: 'eth_sendTransaction', data: {} } as never
        const displayData = {} as never
        approvalController.requestApproval({
          request,
          displayData,
          signingData
        })
        const { onApprove: capturedOnApprove } =
          mockWalletConnectCacheSet.mock.calls[
            mockWalletConnectCacheSet.mock.calls.length - 1
          ][0]
        await capturedOnApprove({
          walletType: WalletType.MNEMONIC,
          walletId: 'w1',
          network: {},
          account: mockAccount
        })

        expect(mockGetAddressForChainId).not.toHaveBeenCalled()
      })

      it('caches signing address for injected dApp requests — CP-13825', async () => {
        const request = makeInjectedDappRequest(RpcMethod.ETH_SEND_TRANSACTION)
        mockGetAddressForChainId.mockReturnValue(EVM_ADDRESS)

        const signingData = { type: 'eth_sendTransaction', data: {} } as never
        const displayData = {} as never
        approvalController.requestApproval({
          request,
          displayData,
          signingData
        })
        const { onApprove: capturedOnApprove } =
          mockWalletConnectCacheSet.mock.calls[
            mockWalletConnectCacheSet.mock.calls.length - 1
          ][0]
        await capturedOnApprove({
          walletType: WalletType.MNEMONIC,
          walletId: 'w1',
          network: {},
          account: mockAccount
        })

        expect(mockGetAddressForChainId).toHaveBeenCalledWith(
          request.chainId,
          mockAccount
        )
      })

      it('does not cache signing address for non-tx-send methods', async () => {
        const request = makeDappRequest(RpcMethod.PERSONAL_SIGN)

        const signingData = { type: 'personal_sign', data: {} } as never
        const displayData = {} as never
        approvalController.requestApproval({
          request,
          displayData,
          signingData
        })
        const { onApprove: capturedOnApprove } =
          mockWalletConnectCacheSet.mock.calls[
            mockWalletConnectCacheSet.mock.calls.length - 1
          ][0]
        await capturedOnApprove({
          walletType: WalletType.MNEMONIC,
          walletId: 'w1',
          network: {},
          account: mockAccount
        })

        expect(mockGetAddressForChainId).not.toHaveBeenCalled()
      })
    })
  })

  // ── onTransactionReverted ─────────────────────────────────────────────────

  describe('onTransactionReverted', () => {
    it('shows an error toast', () => {
      approvalController.onTransactionReverted({
        txHash: '0xabc',
        request: makeRequest()
      })

      expect(transactionSnackbar.error).toHaveBeenCalledWith({
        error: 'Transaction reverted'
      })
    })

    describe('dapp analytics', () => {
      it('fires capture with _failed event including txHash for dapp requests', async () => {
        const request = makeDappRequest(RpcMethod.ETH_SEND_TRANSACTION)
        await populateSigningAddressCache(request)

        approvalController.onTransactionReverted({
          txHash: TX_HASH,
          request
        })

        expect(AnalyticsService.capture).toHaveBeenCalledWith(
          'eth_sendTransaction_failed',
          {
            provider: 'walletConnect',
            encrypted: {
              dAppUrl: DAPP_URL,
              // EVM address is lowercased to a canonical form (CP-13825)
              address: EVM_ADDRESS.toLowerCase(),
              chainId: 'eip155:1',
              txHash: TX_HASH
            }
          }
        )
      })

      it('fires bitcoin_sendTransaction_failed for bitcoin reverts', async () => {
        const btcAddress = 'tb1qlzsvluv4cahzz8zzwud40x2hn3zq4c7zak6spw'
        const request = makeDappRequest(
          RpcMethod.BITCOIN_SEND_TRANSACTION,
          'bip122:000000000019d6689c085ae165831e93'
        )
        await populateSigningAddressCache(request, btcAddress)

        approvalController.onTransactionReverted({
          txHash: 'btctxhash',
          request
        })

        expect(AnalyticsService.capture).toHaveBeenCalledWith(
          'bitcoin_sendTransaction_failed',
          {
            provider: 'walletConnect',
            encrypted: expect.objectContaining({
              address: btcAddress,
              txHash: 'btctxhash'
            })
          }
        )
      })

      it('does NOT fire analytics for wallet-internal requests (CORE_MOBILE_META)', () => {
        approvalController.onTransactionReverted({
          txHash: TX_HASH,
          request: makeInternalRequest(RpcMethod.ETH_SEND_TRANSACTION)
        })

        expect(AnalyticsService.capture).not.toHaveBeenCalled()
      })

      it('fires _failed for injected dApp requests (in-app topic, real url) — CP-13825', async () => {
        const request = makeInjectedDappRequest(RpcMethod.ETH_SEND_TRANSACTION)
        await populateSigningAddressCache(request)

        approvalController.onTransactionReverted({
          txHash: TX_HASH,
          request
        })

        expect(AnalyticsService.capture).toHaveBeenCalledWith(
          'eth_sendTransaction_failed',
          {
            provider: 'injected',
            encrypted: {
              dAppUrl: DAPP_URL,
              // EVM address is lowercased to a canonical form (CP-13825)
              address: EVM_ADDRESS.toLowerCase(),
              chainId: 'eip155:1',
              txHash: TX_HASH
            }
          }
        )
      })

      it('always includes txHash in _failed payload (matches Extension behavior)', async () => {
        const request = makeDappRequest(
          RpcMethod.SOLANA_SIGN_AND_SEND_TRANSACTION,
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'
        )
        await populateSigningAddressCache(request)

        approvalController.onTransactionReverted({
          txHash: '0xrevertedtx',
          request
        })

        const call = (AnalyticsService.capture as jest.Mock).mock.calls[0]
        expect(call[1]).toHaveProperty('encrypted.txHash', '0xrevertedtx')
      })
    })
  })

  // ── requestPublicKey ──────────────────────────────────────────────────────

  describe('requestPublicKey', () => {
    it('parses secretId and delegates to WalletService', async () => {
      const secretId = JSON.stringify({
        walletId: 'w1',
        walletType: WalletType.MNEMONIC
      })
      mockGetPublicKeyFor.mockResolvedValue('0xpubkey')

      const result = await approvalController.requestPublicKey({
        secretId,
        derivationPath: "m/44'/60'/0'/0/0",
        curve: 'secp256k1'
      })

      expect(mockGetPublicKeyFor).toHaveBeenCalledWith({
        walletId: 'w1',
        walletType: WalletType.MNEMONIC,
        derivationPath: "m/44'/60'/0'/0/0",
        curve: 'secp256k1'
      })
      expect(result).toBe('0xpubkey')
    })
  })

  // ── handleLedgerOnReject ──────────────────────────────────────────────────

  describe('handleLedgerOnReject', () => {
    it('disconnects Ledger and calls onReject', async () => {
      mockDisconnect.mockResolvedValue(undefined)
      const resolve = jest.fn()

      await approvalController.handleLedgerOnReject({ resolve })

      expect(mockDisconnect).toHaveBeenCalledTimes(1)
      expect(mockOnReject).toHaveBeenCalledWith({ resolve })
    })
  })

  // ── handleGoBackIfNeeded ──────────────────────────────────────────────────

  describe('handleGoBackIfNeeded', () => {
    it('goes back when on the approval screen and canGoBack is true', () => {
      mockCurrentRouteStore.getState.mockReturnValue({
        currentRoute: '/approval',
        topRoute: undefined,
        setCurrentRoute: jest.fn(),
        setTopRoute: jest.fn()
      })
      mockRouter.canGoBack.mockReturnValue(true)

      approvalController.handleGoBackIfNeeded()

      expect(mockRouter.back).toHaveBeenCalledTimes(1)
    })

    it('goes back when on the injected connect modal group (dynamic [approvalId] child) and canGoBack is true', () => {
      // CP-14385 moved the connect screen to a dynamic `[approvalId]` child, but
      // RootNavigator stores the (signedIn) child = the modal GROUP name, so the
      // route still ends with `authorizeInjectedDapp`. This guards that the
      // dismissal (relied on for cross-origin nav cleanup) keeps matching.
      mockCurrentRouteStore.getState.mockReturnValue({
        currentRoute: '(modals)/authorizeInjectedDapp',
        topRoute: undefined,
        setCurrentRoute: jest.fn(),
        setTopRoute: jest.fn()
      })
      mockRouter.canGoBack.mockReturnValue(true)

      approvalController.handleGoBackIfNeeded()

      expect(mockRouter.back).toHaveBeenCalledTimes(1)
    })

    it('goes back when on the ledgerReviewTransaction screen and canGoBack is true', () => {
      mockCurrentRouteStore.getState.mockReturnValue({
        currentRoute: '/ledgerReviewTransaction',
        topRoute: undefined,
        setCurrentRoute: jest.fn(),
        setTopRoute: jest.fn()
      })
      mockRouter.canGoBack.mockReturnValue(true)

      approvalController.handleGoBackIfNeeded()

      expect(mockRouter.back).toHaveBeenCalledTimes(1)
    })

    it('does not go back when canGoBack is false', () => {
      mockCurrentRouteStore.getState.mockReturnValue({
        currentRoute: '/approval',
        topRoute: undefined,
        setCurrentRoute: jest.fn(),
        setTopRoute: jest.fn()
      })
      mockRouter.canGoBack.mockReturnValue(false)

      approvalController.handleGoBackIfNeeded()

      expect(mockRouter.back).not.toHaveBeenCalled()
    })

    it('does not go back when on an unrelated route', () => {
      mockCurrentRouteStore.getState.mockReturnValue({
        currentRoute: '/home',
        topRoute: undefined,
        setCurrentRoute: jest.fn(),
        setTopRoute: jest.fn()
      })
      mockRouter.canGoBack.mockReturnValue(true)

      approvalController.handleGoBackIfNeeded()

      expect(mockRouter.back).not.toHaveBeenCalled()
    })

    it('does NOT pop the approval route when excludeApproval is set (screen self-dismisses)', () => {
      // The cross-origin nav path passes excludeApproval: the approval screen
      // owns its own dismissal via its request signal, so popping here too would
      // double router.back(). (CP-14422)
      mockCurrentRouteStore.getState.mockReturnValue({
        currentRoute: '/approval',
        topRoute: undefined,
        setCurrentRoute: jest.fn(),
        setTopRoute: jest.fn()
      })
      mockRouter.canGoBack.mockReturnValue(true)

      approvalController.handleGoBackIfNeeded({ excludeApproval: true })

      expect(mockRouter.back).not.toHaveBeenCalled()
    })

    it('still pops non-approval modals when excludeApproval is set', () => {
      mockCurrentRouteStore.getState.mockReturnValue({
        currentRoute: '(modals)/addEthereumChain',
        topRoute: undefined,
        setCurrentRoute: jest.fn(),
        setTopRoute: jest.fn()
      })
      mockRouter.canGoBack.mockReturnValue(true)

      approvalController.handleGoBackIfNeeded({ excludeApproval: true })

      expect(mockRouter.back).toHaveBeenCalledTimes(1)
    })
  })

  // ── session account authorization (CP-14604) ─────────────────────────────

  describe('session account authorization', () => {
    const displayData = {} as never
    const SOLANA_CHAIN_ID = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'
    const GRANTED_SVM_ADDRESS = '9gQmZ7fTTgv5hVScrr9QqT6SpBs7i4cKLDdj4tuae3sW'
    const UNGRANTED_SVM_ADDRESS = '4Nd1mYQZ6X8jY6nWn6iVrDpcLzJq9z2NKV1S1nGiqNz1'

    const makeSolanaSigningData = (account: string) =>
      ({
        type: RpcMethod.SOLANA_SIGN_TRANSACTION,
        account,
        data: 'serialized-tx'
      } as never)

    const sessionWithGrantedAccounts = {
      namespaces: {
        solana: {
          accounts: [`${SOLANA_CHAIN_ID}:${GRANTED_SVM_ADDRESS}`],
          methods: ['solana_signTransaction'],
          events: []
        }
      }
    } as never

    it('rejects when the signing account was never granted to the WC session', async () => {
      mockGetSession.mockReturnValue(sessionWithGrantedAccounts)

      const request = makeDappRequest(
        RpcMethod.SOLANA_SIGN_TRANSACTION,
        SOLANA_CHAIN_ID
      )

      const result = await approvalController.requestApproval({
        request,
        displayData,
        signingData: makeSolanaSigningData(UNGRANTED_SVM_ADDRESS)
      })

      expect(mockGetSession).toHaveBeenCalledWith(DAPP_SESSION_ID)
      expect('error' in result && result.error).toMatchObject({
        message: 'Requested address is not authorized'
      })
      expect(mockRouter.navigate).not.toHaveBeenCalled()
      expect(mockWalletConnectCacheSet).not.toHaveBeenCalled()
    })

    it('shows the approval screen when the signing account is granted to the WC session', () => {
      mockGetSession.mockReturnValue(sessionWithGrantedAccounts)

      const request = makeDappRequest(
        RpcMethod.SOLANA_SIGN_TRANSACTION,
        SOLANA_CHAIN_ID
      )

      approvalController.requestApproval({
        request,
        displayData,
        signingData: makeSolanaSigningData(GRANTED_SVM_ADDRESS)
      })

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/approval' })
      )
    })

    it('never queries the WC client for in-app / injected-browser requests (WC may be uninitialized)', () => {
      const request = makeInjectedDappRequest(
        RpcMethod.SOLANA_SIGN_TRANSACTION,
        SOLANA_CHAIN_ID
      )

      approvalController.requestApproval({
        request,
        displayData,
        signingData: makeSolanaSigningData(UNGRANTED_SVM_ADDRESS)
      })

      expect(mockGetSession).not.toHaveBeenCalled()
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/approval' })
      )
    })

    it('skips the check when no WC session exists for the topic', () => {
      mockGetSession.mockReturnValue(undefined)

      const request = makeDappRequest(
        RpcMethod.SOLANA_SIGN_TRANSACTION,
        SOLANA_CHAIN_ID
      )

      approvalController.requestApproval({
        request,
        displayData,
        signingData: makeSolanaSigningData(UNGRANTED_SVM_ADDRESS)
      })

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/approval' })
      )
    })

    it('rejects an EVM transaction whose from-address was never granted to the WC session', async () => {
      mockGetSession.mockReturnValue({
        namespaces: {
          eip155: {
            accounts: [`eip155:43114:${EVM_ADDRESS}`],
            methods: ['eth_sendTransaction'],
            events: []
          }
        }
      } as never)

      const request = makeDappRequest(
        RpcMethod.ETH_SEND_TRANSACTION,
        'eip155:43114'
      )

      const result = await approvalController.requestApproval({
        request,
        displayData,
        signingData: {
          type: RpcMethod.ETH_SEND_TRANSACTION,
          account: '0x341b0073b66bfc19FCB54308861f604F5Eb8f51b',
          data: {}
        } as never
      })

      expect('error' in result && result.error).toMatchObject({
        message: 'Requested address is not authorized'
      })
      expect(mockRouter.navigate).not.toHaveBeenCalled()
    })

    it('accepts an EVM address granted under a different chain of the eip155 namespace', () => {
      mockGetSession.mockReturnValue({
        namespaces: {
          eip155: {
            accounts: [`eip155:1:${EVM_ADDRESS}`],
            methods: ['eth_sendTransaction'],
            events: []
          }
        }
      } as never)

      const request = makeDappRequest(
        RpcMethod.ETH_SEND_TRANSACTION,
        'eip155:43114'
      )

      approvalController.requestApproval({
        request,
        displayData,
        signingData: {
          type: RpcMethod.ETH_SEND_TRANSACTION,
          // lowercased vs the checksummed EVM_ADDRESS in the session grant —
          // dApp-supplied casing must not defeat authorization
          account: EVM_ADDRESS.toLowerCase(),
          data: {}
        } as never
      })

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/approval' })
      )
    })

    it('skips the check for signing data that carries no account (avalanche transactions)', () => {
      mockGetSession.mockReturnValue(sessionWithGrantedAccounts)

      const request = makeDappRequest(
        RpcMethod.AVALANCHE_SEND_TRANSACTION,
        AvalancheCaip2ChainId.P
      )

      approvalController.requestApproval({
        request,
        displayData,
        signingData: {
          type: RpcMethod.AVALANCHE_SEND_TRANSACTION,
          unsignedTxJson: '{}',
          data: {},
          vm: 'PVM'
        } as never
      })

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/approval' })
      )
    })
  })

  // ── requestApproval ───────────────────────────────────────────────────────

  describe('requestApproval', () => {
    const signingData = { type: 'eth_sendTransaction', data: {} } as never
    const displayData = {} as never

    function makeApprovalRequest(overrides: Partial<RpcRequest> = {}) {
      return makeRequest({ sessionId: 'core-mobile', ...overrides })
    }

    it('navigates to /approval with FORM_SHEET for in-app requests', () => {
      mockIsInAppRequest.mockReturnValue(true)
      const request = makeApprovalRequest()

      approvalController.requestApproval({ request, displayData, signingData })

      expect(mockRouter.navigate).toHaveBeenCalledWith({
        pathname: '/approval',
        params: { presentationMode: NavigationPresentationMode.FORM_SHEET }
      })
    })

    it('navigates to /approval without presentationMode for WalletConnect requests', () => {
      mockIsInAppRequest.mockReturnValue(false)
      const request = makeApprovalRequest()

      approvalController.requestApproval({ request, displayData, signingData })

      expect(mockRouter.navigate).toHaveBeenCalledWith({
        pathname: '/approval',
        params: { presentationMode: undefined }
      })
    })

    it('calls onApprove directly for non-Ledger wallet types', async () => {
      const request = makeApprovalRequest()
      approvalController.requestApproval({ request, displayData, signingData })

      const { onApprove: capturedOnApprove } =
        mockWalletConnectCacheSet.mock.calls[0][0]

      const params = {
        walletType: WalletType.MNEMONIC,
        walletId: 'w1'
      } as never
      await capturedOnApprove(params)

      expect(mockOnApprove).toHaveBeenCalledWith(
        expect.objectContaining({
          walletType: WalletType.MNEMONIC,
          signingData
        })
      )
    })

    it('sets ledger review params in store for LEDGER wallet type', async () => {
      const request = makeApprovalRequest()
      approvalController.requestApproval({ request, displayData, signingData })

      const { onApprove: capturedOnApprove } =
        mockWalletConnectCacheSet.mock.calls[0][0]
      const params = { walletType: WalletType.LEDGER } as never
      await capturedOnApprove(params)

      expect(mockSetReviewTransactionParams).toHaveBeenCalledTimes(1)
      expect(mockSetReviewTransactionParams).toHaveBeenCalledWith(
        expect.objectContaining({
          rpcMethod: request.method,
          onApprove: expect.any(Function),
          onReject: expect.any(Function)
        })
      )
    })

    it('sets ledger review params in store for LEDGER_LIVE wallet type', async () => {
      const request = makeApprovalRequest()
      approvalController.requestApproval({ request, displayData, signingData })

      const { onApprove: capturedOnApprove } =
        mockWalletConnectCacheSet.mock.calls[0][0]
      const params = { walletType: WalletType.LEDGER_LIVE } as never
      await capturedOnApprove(params)

      expect(mockSetReviewTransactionParams).toHaveBeenCalledTimes(1)
      expect(mockSetReviewTransactionParams).toHaveBeenCalledWith(
        expect.objectContaining({
          rpcMethod: request.method,
          onApprove: expect.any(Function),
          onReject: expect.any(Function)
        })
      )
    })

    it('calls onReject with the rejection message when the user rejects', () => {
      const request = makeApprovalRequest()
      approvalController.requestApproval({ request, displayData, signingData })

      const { onReject: capturedOnReject } =
        mockWalletConnectCacheSet.mock.calls[0][0]
      capturedOnReject('User denied')

      expect(mockOnReject).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'User denied' })
      )
    })

    it('injects WARNING alert into displayData when request carries quickSwapsManualReviewReason (per-tx fallback path)', async () => {
      const request = makeApprovalRequest({
        context: {
          quickSwapsManualReviewReason: 'Slippage tolerance exceeded'
        } as never
      })
      const params = {
        request,
        displayData: {} as never,
        signingData
      }
      approvalController.requestApproval(params)

      const alert = (
        params.displayData as { alert?: { type: string; details: unknown } }
      ).alert
      expect(alert).toBeDefined()
      expect(alert?.type).toBe('Warning')
      expect(alert?.details).toEqual({
        title: 'Manual approval required',
        description: 'Manual approval required\nSlippage tolerance exceeded'
      })
    })

    it('does not inject a fallback alert when quickSwapsManualReviewReason is absent', async () => {
      const request = makeApprovalRequest()
      const params = {
        request,
        displayData: {} as never,
        signingData
      }
      approvalController.requestApproval(params)

      const alert = (params.displayData as { alert?: unknown }).alert
      expect(alert).toBeUndefined()
    })

    it('preserves an existing Blockaid alert and does not clobber it with the fallback reason', async () => {
      const existingAlert = {
        type: 'Warning',
        details: { title: 'Suspicious spender', description: 'Blockaid' }
      }
      const request = makeApprovalRequest({
        context: {
          quickSwapsManualReviewReason: 'Slippage tolerance exceeded'
        } as never
      })
      const params = {
        request,
        displayData: { alert: existingAlert } as never,
        signingData
      }
      approvalController.requestApproval(params)

      const alert = (params.displayData as { alert?: typeof existingAlert })
        .alert
      expect(alert).toEqual(existingAlert)
    })

    it('injects WARNING alert into displayData when single-tx validator returns requiresManualApproval', async () => {
      const { requestValidators } = jest.requireActual('./validators')
      const mockSign = jest.requireMock('services/wallet/WalletService').default
        .sign as jest.Mock

      // Snapshot + restore on teardown so the default swapValidator
      // isn't lost for any test that runs after.
      const originalValidators = [...requestValidators]
      requestValidators.push({
        canHandle: () => true,
        validate: async () => ({
          isValid: false,
          requiresManualApproval: true,
          reason: 'Slippage tolerance exceeded',
          code: 'slippage_exceeded'
        })
      })

      try {
        const params = {
          request: makeApprovalRequest(),
          displayData: {} as never,
          signingData: signingData as never
        }
        // requestApproval returns a Promise that only resolves via the
        // modal's onApprove/onReject. We fire-and-forget here — we only
        // care about the side-effect on displayData.
        approvalController.requestApproval(params)
        // Let the await on validator.validate() resolve.
        await new Promise(resolve => setImmediate(resolve))

        const alert = (
          params.displayData as { alert?: { type: string; details: unknown } }
        ).alert
        expect(alert).toBeDefined()
        expect(alert?.type).toBe('Warning')
        expect(alert?.details).toEqual({
          title: 'Manual approval required',
          description: 'Manual approval required\nSlippage tolerance exceeded'
        })
        expect(mockSign).not.toHaveBeenCalled()
      } finally {
        requestValidators.splice(
          0,
          requestValidators.length,
          ...originalValidators
        )
      }
    })
  })

  // CP-14211: requestBatchApproval consults the validator registry and,
  // on isValid:true, signs each signingRequests[i].signingData via
  // WalletService.sign (returning signed RLP for the EVM module to
  // broadcast). On manual-review / hard-reject, returns a structured
  // error. The lifecycle (onTransactionPending) is fired by the EVM
  // module's broadcast loop via this same controller's method —
  // verified separately in the onTransactionPending describe block.
  describe('requestBatchApproval', () => {
    const { approvalValidators } = jest.requireActual('./validators')
    const mockSign = jest.requireMock('services/wallet/WalletService').default
      .sign as jest.Mock

    // Snapshot once; restored on every beforeEach and afterAll so the
    // default batchSwapValidator isn't lost between tests (or for any
    // test that runs after this describe block).
    const originalValidators = [...approvalValidators]
    const restoreValidators = (): void => {
      approvalValidators.splice(
        0,
        approvalValidators.length,
        ...originalValidators
      )
    }

    const baseRequest = (): RpcRequest =>
      ({
        ...makeRequest(),
        method: RpcMethod.ETH_SEND_TRANSACTION_BATCH as never,
        context: {
          walletId: 'wallet-1',
          walletType: 'mnemonic',
          accountIndex: 0,
          network: { chainId: 43114, vmName: 'EVM' }
        }
      } as RpcRequest)

    const makeSigningRequest = (data: Record<string, unknown> = {}) => ({
      signingData: {
        type: 'eth_sendTransaction',
        account: '0x123',
        data
      },
      displayData: {}
    })

    const baseParams = (
      signingRequests: ReturnType<typeof makeSigningRequest>[] = [
        makeSigningRequest({ to: '0xrouter' })
      ]
    ) => ({
      request: baseRequest(),
      signingRequests,
      displayData: {} as never,
      updateTx: (() => ({})) as never
    })

    const actualQuickSwapsBypass = jest.requireActual('./quickSwapsBypass')

    // A single `await Promise.resolve()` isn't enough to flush the manual
    // path when going through the REAL evaluateBatchApproval — it has its
    // own internal `await validator.validate(...)` — so use a macrotask
    // flush (matches the existing helper in the cancel-bridge describe
    // block below).
    const flushMicrotasks = (): Promise<void> =>
      new Promise(resolve => setTimeout(resolve, 0))

    beforeEach(() => {
      // Reset to the original baseline before each test; individual
      // tests push their own mock validator on top.
      restoreValidators()
      mockSign.mockReset()
      // Restore the real evaluateBatchApproval/signBatchRequests implementation —
      // the manual-path test below overrides these with mockResolvedValue,
      // which (unlike jest.clearAllMocks()) survives between tests.
      ;(evaluateBatchApproval as jest.Mock).mockImplementation(
        actualQuickSwapsBypass.evaluateBatchApproval
      )
      ;(signBatchRequests as jest.Mock).mockImplementation(
        actualQuickSwapsBypass.signBatchRequests
      )
    })

    afterAll(restoreValidators)

    it('opens the manual batch approval screen when no validator matches', async () => {
      approvalController.requestBatchApproval(baseParams() as never)
      await flushMicrotasks()

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/approvalBatch' })
      )
      expect(mockSign).not.toHaveBeenCalled()
    })

    it('navigates to /approvalBatch and resolves signed txs on approve (manual path)', async () => {
      // Force the manual branch.
      ;(evaluateBatchApproval as jest.Mock).mockResolvedValue({
        kind: 'manual'
      })
      ;(signBatchRequests as jest.Mock).mockResolvedValue({
        signedTxs: [{ signedData: '0xsigned0' }, { signedData: '0xsigned1' }]
      })

      const params = {
        request: {
          requestId: 'b1',
          method: 'eth_sendTransactionBatch',
          context: {
            walletId: 'w1',
            walletType: 'MNEMONIC',
            accountIndex: 0,
            network: {}
          }
        },
        displayData: {},
        signingRequests: [
          { signingData: { data: { chainId: 43114 } } },
          { signingData: { data: { chainId: 43114 } } }
        ]
      } as never

      const promise = approvalController.requestBatchApproval(params)
      await flushMicrotasks()

      expect(router.navigate).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/approvalBatch' })
      )
      const cached = walletConnectCache.batchApprovalParams.get()
      cached.onApprove({})
      const result = await promise
      expect(result).toEqual({
        result: [{ signedData: '0xsigned0' }, { signedData: '0xsigned1' }]
      })
    })

    it('applies a per-index spend-limit override to .data only (and only for the edited index)', async () => {
      // Force the manual branch; record what handleBatchApprovalApprove
      // passes to signBatchRequests after applying the overrides.
      ;(evaluateBatchApproval as jest.Mock).mockResolvedValue({
        kind: 'manual'
      })
      let recordedTransactions: unknown
      ;(signBatchRequests as jest.Mock).mockImplementation(
        async (_request, transactions) => {
          recordedTransactions = transactions
          return {
            signedTxs: [{ signedData: '0xa' }, { signedData: '0xb' }]
          }
        }
      )

      const params = {
        request: {
          requestId: 'b-override',
          method: 'eth_sendTransactionBatch',
          context: {
            walletId: 'w1',
            walletType: 'MNEMONIC',
            accountIndex: 0,
            network: {}
          }
        },
        displayData: {},
        signingRequests: [
          {
            signingData: {
              data: {
                chainId: 43114,
                to: '0xTo0',
                value: '0x0',
                data: '0xORIG0'
              }
            }
          },
          {
            signingData: {
              data: {
                chainId: 43114,
                to: '0xTo1',
                value: '0x0',
                data: '0xORIG1'
              }
            }
          }
        ]
      } as never

      const promise = approvalController.requestBatchApproval(params)
      await flushMicrotasks()

      const cached = walletConnectCache.batchApprovalParams.get()
      cached.onApprove({ 0: '0xOVERRIDE' })
      const result = await promise

      const transactions = recordedTransactions as Record<string, unknown>[]
      // Only .data is replaced on the edited index; other fields preserved.
      expect(transactions[0]).toEqual({
        chainId: 43114,
        to: '0xTo0',
        value: '0x0',
        data: '0xOVERRIDE'
      })
      // Untouched index passes through unchanged.
      expect(transactions[1]).toEqual({
        chainId: 43114,
        to: '0xTo1',
        value: '0x0',
        data: '0xORIG1'
      })
      // Input is not mutated — the original signingRequest data is intact.
      expect(
        (
          params as unknown as {
            signingRequests: { signingData: { data: { data: string } } }[]
          }
        ).signingRequests[0]?.signingData.data.data
      ).toBe('0xORIG0')
      expect(result).toEqual({
        result: [{ signedData: '0xa' }, { signedData: '0xb' }]
      })
    })

    it('resolves the error envelope when signBatchRequests fails', async () => {
      ;(evaluateBatchApproval as jest.Mock).mockResolvedValue({
        kind: 'manual'
      })
      ;(signBatchRequests as jest.Mock).mockResolvedValue({
        error: { code: -32603, message: 'sign failed' }
      })

      const params = {
        request: {
          requestId: 'b-error',
          method: 'eth_sendTransactionBatch',
          context: {
            walletId: 'w1',
            walletType: 'MNEMONIC',
            accountIndex: 0,
            network: {}
          }
        },
        displayData: {},
        signingRequests: [{ signingData: { data: { chainId: 43114 } } }]
      } as never

      const promise = approvalController.requestBatchApproval(params)
      await flushMicrotasks()

      const cached = walletConnectCache.batchApprovalParams.get()
      cached.onApprove({})
      const result = await promise

      expect(result).toEqual({
        error: { code: -32603, message: 'sign failed' }
      })
    })

    it('signs each signingRequest and returns signed RLP on isValid:true', async () => {
      approvalValidators.push({
        canHandle: () => true,
        validate: async () => ({ isValid: true })
      })
      mockSign
        .mockResolvedValueOnce('0xsigned-approve')
        .mockResolvedValueOnce('0xsigned-swap')

      const result = await approvalController.requestBatchApproval(
        baseParams([
          makeSigningRequest({ to: '0xtoken', data: '0xapprove' }),
          makeSigningRequest({ to: '0xrouter', data: '0xswap' })
        ]) as never
      )

      expect(mockSign).toHaveBeenCalledTimes(2)
      expect('result' in result).toBe(true)
      if ('result' in result) {
        expect(result.result).toEqual([
          { signedData: '0xsigned-approve' },
          { signedData: '0xsigned-swap' }
        ])
      }
      // Verify signing context is read from request.context, not from
      // any callback closure (the architectural-refactor invariant).
      const firstCallArgs = mockSign.mock.calls[0]?.[0]
      expect(firstCallArgs).toMatchObject({
        walletId: 'wallet-1',
        walletType: 'mnemonic',
        accountIndex: 0
      })
    })

    it('returns error when WalletService.sign rejects', async () => {
      approvalValidators.push({
        canHandle: () => true,
        validate: async () => ({ isValid: true })
      })
      mockSign.mockRejectedValue(new Error('insufficient gas'))

      const result = await approvalController.requestBatchApproval(
        baseParams() as never
      )
      expect('error' in result).toBe(true)
    })

    it('returns error when signing context is missing from request.context', async () => {
      approvalValidators.push({
        canHandle: () => true,
        validate: async () => ({ isValid: true })
      })
      const params = baseParams()
      ;(params.request as { context: Record<string, unknown> }).context = {}

      const result = await approvalController.requestBatchApproval(
        params as never
      )
      expect('error' in result).toBe(true)
      expect(mockSign).not.toHaveBeenCalled()
    })

    it('opens the manual batch approval screen when requiresManualApproval', async () => {
      approvalValidators.push({
        canHandle: () => true,
        validate: async () => ({
          isValid: false,
          requiresManualApproval: true,
          reason: 'Slippage exceeded',
          code: 'slippage_exceeded'
        })
      })

      // Falls through to the manual screen (no marker error anymore) —
      // the per-tx approval flow is superseded by the batch approval screen.
      approvalController.requestBatchApproval(baseParams() as never)
      await flushMicrotasks()

      expect(mockSign).not.toHaveBeenCalled()
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/approvalBatch' })
      )
    })

    it('injects WARNING alert into displayData on requiresManualApproval', async () => {
      approvalValidators.push({
        canHandle: () => true,
        validate: async () => ({
          isValid: false,
          requiresManualApproval: true,
          reason: 'Slippage tolerance exceeded',
          code: 'slippage_exceeded'
        })
      })

      const params = baseParams()
      approvalController.requestBatchApproval(params as never)
      await flushMicrotasks()

      const alert = (
        params.displayData as { alert?: { type: string; details: unknown } }
      ).alert
      expect(alert).toBeDefined()
      expect(alert?.type).toBe('Warning')
      expect(alert?.details).toEqual({
        title: 'Manual approval required',
        description: 'Manual approval required\nSlippage tolerance exceeded'
      })
    })

    it('does NOT clobber an existing alert (e.g. Blockaid Warning)', async () => {
      approvalValidators.push({
        canHandle: () => true,
        validate: async () => ({
          isValid: false,
          requiresManualApproval: true,
          reason: 'Slippage exceeded'
        })
      })

      const params = {
        ...baseParams(),
        displayData: {
          alert: {
            type: 'Danger',
            details: { title: 'Blockaid', description: 'Pre-existing' }
          }
        } as never
      }
      approvalController.requestBatchApproval(params as never)
      await flushMicrotasks()

      const alert = (
        params.displayData as { alert?: { type: string; details: unknown } }
      ).alert
      // Original alert is preserved.
      expect(alert?.type).toBe('Danger')
      expect((alert?.details as { description: string }).description).toBe(
        'Pre-existing'
      )
    })

    it('returns error on hard-reject verdict', async () => {
      approvalValidators.push({
        canHandle: () => true,
        validate: async () => ({
          isValid: false,
          requiresManualApproval: false,
          reason: 'Malicious'
        })
      })

      const result = await approvalController.requestBatchApproval(
        baseParams() as never
      )
      expect('error' in result).toBe(true)
      expect(mockSign).not.toHaveBeenCalled()
    })
  })

  // ── cross-origin cancel bridge (CP-14422) ──────────────────────────────────
  describe('requestApproval — cross-origin cancel bridge', () => {
    const signingData = { type: 'eth_sendTransaction', data: {} } as never
    const displayData = {} as never
    const REQ_ID = 'req-1'

    // Park an approval (as requestApproval does) and return the cached callbacks.
    // Pass a signal to register the cancel bridge for this request.
    const park = (
      signal?: AbortSignal
    ): {
      onApprove: (p: unknown) => Promise<void>
      onReject: (m?: string) => void
    } => {
      if (signal) setRequestSignal(REQ_ID, signal)
      approvalController.requestApproval({
        request: makeRequest({ requestId: REQ_ID, sessionId: 'core-mobile' }),
        displayData,
        signingData
      })
      return mockWalletConnectCacheSet.mock.calls[
        mockWalletConnectCacheSet.mock.calls.length - 1
      ][0]
    }

    const flushMicrotasks = (): Promise<void> =>
      new Promise(resolve => setTimeout(resolve, 0))

    afterEach(() => clearRequestSignal(REQ_ID))

    it('settles the parked promise via the real onReject when the request is aborted', () => {
      const controller = new AbortController()
      park(controller.signal)
      mockOnReject.mockClear()

      controller.abort()

      expect(mockOnReject).toHaveBeenCalledWith(
        expect.objectContaining({ resolve: expect.any(Function) })
      )
      // Dismissal stays with setCurrentUrl's handleGoBackIfNeeded — the bridge
      // must NOT also pop the screen (would double router.back()).
      expect(mockRouter.back).not.toHaveBeenCalled()
    })

    it('blocks a late Approve tap after the request was aborted', async () => {
      const controller = new AbortController()
      const parked = park(controller.signal)
      controller.abort()
      mockOnApprove.mockClear()

      await parked.onApprove({ walletType: WalletType.MNEMONIC })

      expect(mockOnApprove).not.toHaveBeenCalled()
    })

    it('tears down Ledger BLE + clears the review store when aborted while Ledger is pending', async () => {
      mockDisconnect.mockResolvedValue(undefined)
      const controller = new AbortController()
      const parked = park(controller.signal)
      // Enter the Ledger sheet (ledgerPending) — BLE connecting, not yet signing.
      await parked.onApprove({ walletType: WalletType.LEDGER })
      mockOnReject.mockClear()
      mockDisconnect.mockClear()
      mockSetReviewTransactionParams.mockClear()

      controller.abort()
      await flushMicrotasks()

      expect(mockDisconnect).toHaveBeenCalled()
      expect(mockSetReviewTransactionParams).toHaveBeenCalledWith(null)
      expect(mockOnReject).toHaveBeenCalled()
    })

    it('drops out of ledgerSigning if the signing pipeline rejects without settling (no app-wide dismissal wedge)', async () => {
      mockDisconnect.mockResolvedValue(undefined)
      const controller = new AbortController()
      const parked = park(controller.signal)
      await parked.onApprove({ walletType: WalletType.LEDGER }) // ledgerPending
      const ledgerParams =
        mockSetReviewTransactionParams.mock.calls[
          mockSetReviewTransactionParams.mock.calls.length - 1
        ][0]
      // On-device signing begins, then the handler pipeline rejects WITHOUT ever
      // calling resolve (e.g. a handler that throws before settling).
      mockOnApprove.mockRejectedValueOnce(new Error('signing blew up'))
      await ledgerParams.onApprove().catch(() => undefined)

      // Phase must NOT be stuck in ledgerSigning — otherwise
      // isLedgerSigningInProgress() stays true forever and every future
      // cross-origin nav across all tabs silently stops dismissing the approval
      // screen. (CP-14422)
      expect(approvalController.isLedgerSigningInProgress()).toBe(false)

      // And the orphaned request is cancellable again (back in ledgerPending):
      // a nav now tears down BLE + settles it.
      mockOnReject.mockClear()
      controller.abort()
      await flushMicrotasks()
      expect(mockOnReject).toHaveBeenCalled()
    })

    it('settles the parked promise immediately on abort even if Ledger BLE disconnect hangs', async () => {
      // BLE disconnect that never resolves — settlement must not be gated behind
      // it, or a hung disconnect would leave the dApp request hanging (the whole
      // point of the abort path is prompt settlement). (CP-14422)
      mockDisconnect.mockReturnValue(new Promise(() => undefined))
      const controller = new AbortController()
      const parked = park(controller.signal)
      await parked.onApprove({ walletType: WalletType.LEDGER }) // ledgerPending
      mockOnReject.mockClear()

      controller.abort()
      // No flush: the reject must have already fired synchronously, not be
      // queued behind the (hanging) disconnect.
      expect(mockOnReject).toHaveBeenCalled()
    })

    it('is a no-op when aborted after on-device Ledger signing has started', async () => {
      const controller = new AbortController()
      const parked = park(controller.signal)
      await parked.onApprove({ walletType: WalletType.LEDGER })
      // Run the stored on-device onApprove → enters ledgerSigning (uncancellable).
      const ledgerParams = mockSetReviewTransactionParams.mock.calls[0][0]
      ledgerParams.onApprove()
      mockOnReject.mockClear()
      mockDisconnect.mockClear()

      controller.abort()
      await flushMicrotasks()

      expect(mockOnReject).not.toHaveBeenCalled()
      expect(mockDisconnect).not.toHaveBeenCalled()

      // Settle the on-device signing so this ledgerSigning entry doesn't leak
      // into the singleton and bleed into later tests' isLedgerSigningInProgress.
      mockOnApprove.mock.calls[mockOnApprove.mock.calls.length - 1][0].resolve(
        {}
      )
    })

    it('caches the request AbortSignal so the approval screen can self-dismiss on cancel', () => {
      // The cross-origin nav can abort + settle the request in the window between
      // navigate('/approval') and the screen mounting, so the generic pop may
      // miss. Caching the signal lets the screen dismiss itself on mount if its
      // request is already dead. (CP-14422)
      const controller = new AbortController()
      park(controller.signal)

      const cached =
        mockWalletConnectCacheSet.mock.calls[
          mockWalletConnectCacheSet.mock.calls.length - 1
        ][0]
      expect(cached.signal).toBe(controller.signal)

      controller.abort() // settle so nothing lingers
    })

    it('isLedgerSigningInProgress is false while only parked', () => {
      const controller = new AbortController()
      park(controller.signal)

      expect(approvalController.isLedgerSigningInProgress()).toBe(false)

      controller.abort() // settle the parked entry so it doesn't linger
    })

    it('isLedgerSigningInProgress flips true once on-device Ledger signing begins', async () => {
      const controller = new AbortController()
      const parked = park(controller.signal)
      // Ledger sheet up (BLE connecting) — still cancellable, not signing yet.
      await parked.onApprove({ walletType: WalletType.LEDGER })
      expect(approvalController.isLedgerSigningInProgress()).toBe(false)

      // On-device signing begins → ledgerSigning (uncancellable).
      const ledgerParams = mockSetReviewTransactionParams.mock.calls[0][0]
      ledgerParams.onApprove()

      expect(approvalController.isLedgerSigningInProgress()).toBe(true)

      // Settle signing so the ledgerSigning entry is cleared (test isolation).
      mockOnApprove.mock.calls[mockOnApprove.mock.calls.length - 1][0].resolve(
        {}
      )
      expect(approvalController.isLedgerSigningInProgress()).toBe(false)
    })

    it('does not bridge requests without a signal (WalletConnect / in-app)', () => {
      const other = new AbortController()
      setRequestSignal('some-other-id', other.signal)
      park() // no signal registered for REQ_ID → no bridge
      mockOnReject.mockClear()

      other.abort()

      expect(mockOnReject).not.toHaveBeenCalled()
      clearRequestSignal('some-other-id')
    })

    it('cancels immediately and neither caches params nor opens a modal if already aborted before parking', () => {
      const controller = new AbortController()
      controller.abort()
      setRequestSignal(REQ_ID, controller.signal)
      mockOnReject.mockClear()
      mockRouter.navigate.mockClear()
      mockWalletConnectCacheSet.mockClear()

      approvalController.requestApproval({
        request: makeRequest({ requestId: REQ_ID, sessionId: 'core-mobile' }),
        displayData,
        signingData
      })

      expect(mockOnReject).toHaveBeenCalled()
      // No stale modal for a request that's already dead. (pre-park race)
      expect(mockRouter.navigate).not.toHaveBeenCalled()
      // And we must NOT leave the parked callbacks (incl. the now-dead resolve
      // closure) + request data sitting in the single-slot cache: nothing would
      // consume/clear it since the approval screen never mounts. (CP-14422)
      expect(mockWalletConnectCacheSet).not.toHaveBeenCalled()
    })

    it('stays cancellable during a retryable Ledger error (BLE torn down if aborted then)', async () => {
      mockDisconnect.mockResolvedValue(undefined)
      const controller = new AbortController()
      const parked = park(controller.signal)
      await parked.onApprove({ walletType: WalletType.LEDGER }) // ledgerPending
      const ledgerParams = mockSetReviewTransactionParams.mock.calls[0][0]
      ledgerParams.onApprove() // on-device signing begins → ledgerSigning
      // Device returns a retryable error → Retry/Cancel alert; phase must drop
      // back to ledgerPending so a nav can still cancel + tear down BLE.
      const onApproveArg =
        mockOnApprove.mock.calls[mockOnApprove.mock.calls.length - 1][0]
      onApproveArg.resolve({ error: { message: 'retryable' } })
      mockOnReject.mockClear()
      mockDisconnect.mockClear()

      controller.abort()
      await flushMicrotasks()

      expect(mockDisconnect).toHaveBeenCalled()
      expect(mockOnReject).toHaveBeenCalled()
    })

    it('bridges overlapping requests independently (aborting one does not clobber the other)', () => {
      const cA = new AbortController()
      const cB = new AbortController()
      setRequestSignal('req-A', cA.signal)
      approvalController.requestApproval({
        request: makeRequest({ requestId: 'req-A', sessionId: 'core-mobile' }),
        displayData,
        signingData
      })
      setRequestSignal('req-B', cB.signal)
      approvalController.requestApproval({
        request: makeRequest({ requestId: 'req-B', sessionId: 'core-mobile' }),
        displayData,
        signingData
      })
      mockOnReject.mockClear()

      cA.abort()
      expect(mockOnReject).toHaveBeenCalledTimes(1)

      mockOnReject.mockClear()
      cB.abort() // would no-op if req-B's bridge had been clobbered by req-A
      expect(mockOnReject).toHaveBeenCalledTimes(1)

      clearRequestSignal('req-A')
      clearRequestSignal('req-B')
    })

    it('evicts the oldest parked approval with full teardown when at capacity', () => {
      // Fill activeApprovals to capacity (ACTIVE_APPROVALS_MAX = 10) with distinct
      // browser signing requests, each with its own cancel bridge.
      const controllers: AbortController[] = []
      for (let i = 0; i < 10; i++) {
        const c = new AbortController()
        controllers.push(c)
        setRequestSignal(`evict-${i}`, c.signal)
        approvalController.requestApproval({
          request: makeRequest({
            requestId: `evict-${i}`,
            sessionId: 'core-mobile'
          }),
          displayData,
          signingData
        })
      }
      mockOnReject.mockClear()

      // An 11th request must evict the oldest (evict-0) — and that eviction must
      // run the real teardown (settle the promise + detach), NOT BoundedMap's
      // silent plain-delete that would leak the listener/signal. (CP-14422)
      const overflow = new AbortController()
      setRequestSignal('evict-10', overflow.signal)
      approvalController.requestApproval({
        request: makeRequest({
          requestId: 'evict-10',
          sessionId: 'core-mobile'
        }),
        displayData,
        signingData
      })

      // Oldest was settled exactly once via the real onReject.
      expect(mockOnReject).toHaveBeenCalledTimes(1)

      // Oldest's bridge was detached: re-aborting it is now a no-op.
      mockOnReject.mockClear()
      controllers[0]?.abort()
      expect(mockOnReject).not.toHaveBeenCalled()

      // A still-parked entry keeps its bridge — aborting it still cancels.
      controllers[1]?.abort()
      expect(mockOnReject).toHaveBeenCalledTimes(1)

      // Settle the remaining parked entries (evict-2..9 + overflow evict-10) so
      // nothing leaks into the singleton for later tests.
      overflow.abort()
      for (let i = 2; i < 10; i++) controllers[i]?.abort()

      for (let i = 0; i <= 10; i++) clearRequestSignal(`evict-${i}`)
    })

    it('keeps a ledgerSigning oldest and evicts the oldest cancellable entry at capacity (CP-14422)', async () => {
      // Guard against contamination from a prior test leaking signing state.
      expect(approvalController.isLedgerSigningInProgress()).toBe(false)

      mockDisconnect.mockResolvedValue(undefined)
      const base = mockWalletConnectCacheSet.mock.calls.length
      const controllers: AbortController[] = []
      for (let i = 0; i < 10; i++) {
        const c = new AbortController()
        controllers.push(c)
        setRequestSignal(`sign-${i}`, c.signal)
        approvalController.requestApproval({
          request: makeRequest({
            requestId: `sign-${i}`,
            sessionId: 'core-mobile'
          }),
          displayData,
          signingData
        })
      }

      // Drive the OLDEST (sign-0) into on-device signing → uncancellable.
      await mockWalletConnectCacheSet.mock.calls[base][0].onApprove({
        walletType: WalletType.LEDGER
      })
      mockSetReviewTransactionParams.mock.calls[
        mockSetReviewTransactionParams.mock.calls.length - 1
      ][0].onApprove()
      expect(approvalController.isLedgerSigningInProgress()).toBe(true)
      mockOnReject.mockClear()

      // An 11th request at capacity. The oldest is ledgerSigning (uncancellable),
      // so it must NOT be the eviction victim — picking it would no-op and fall
      // through to BoundedMap's silent delete(), leaking its listener/signal and
      // dropping the in-progress signing. The oldest *cancellable* entry (sign-1)
      // is settled+detached instead. (CP-14422)
      const overflow = new AbortController()
      setRequestSignal('sign-10', overflow.signal)
      approvalController.requestApproval({
        request: makeRequest({
          requestId: 'sign-10',
          sessionId: 'core-mobile'
        }),
        displayData,
        signingData
      })

      // The in-progress signing survived — not silently dropped.
      expect(approvalController.isLedgerSigningInProgress()).toBe(true)
      // Exactly one eviction settlement: the oldest cancellable victim (sign-1).
      expect(mockOnReject).toHaveBeenCalledTimes(1)
      // That victim's bridge was detached: re-aborting it is now a no-op.
      mockOnReject.mockClear()
      controllers[1]?.abort()
      expect(mockOnReject).not.toHaveBeenCalled()

      // Cleanup: settle sign-0's signing + drop the rest so nothing leaks.
      mockOnApprove.mock.calls[mockOnApprove.mock.calls.length - 1][0].resolve(
        {}
      )
      overflow.abort()
      for (let i = 2; i < 10; i++) controllers[i]?.abort()
      for (let i = 0; i <= 10; i++) clearRequestSignal(`sign-${i}`)
    })
  })
})
