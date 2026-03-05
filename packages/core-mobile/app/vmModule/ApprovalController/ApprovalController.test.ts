import { RpcRequest } from '@avalabs/vm-module-types'
import { WalletType } from 'services/wallet/types'
import { NavigationPresentationMode } from 'new/common/types'
import { walletConnectCache } from 'services/walletconnectv2/walletConnectCache/walletConnectCache'
import { router } from 'expo-router'
import { currentRouteStore } from 'new/routes/store'
import { isInAppRequest } from 'store/rpc/utils/isInAppRequest'
import { transactionSnackbar } from 'new/common/utils/toast'
import { promptForAppReviewAfterSuccessfulTransaction } from 'features/appReview/utils/promptForAppReviewAfterSuccessfulTransaction'
import { showLedgerReviewTransaction } from 'features/ledger/utils'
import {
  isToastsAndConfettiEnabled,
  isInAppAvalancheRequest,
  isConfettiEnabled,
  isInAppReview,
  showConfetti
} from '../utils/requestContext'
import { onApprove } from './onApprove'
import { onReject } from './onReject'
import { approvalController } from './ApprovalController'

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../utils/requestContext', () => ({
  isToastsAndConfettiEnabled: jest.fn(() => true),
  isInAppAvalancheRequest: jest.fn(() => false),
  isConfettiEnabled: jest.fn(() => true),
  isInAppReview: jest.fn(() => false),
  showConfetti: jest.fn()
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
jest.mock(
  'services/walletconnectv2/walletConnectCache/walletConnectCache',
  () => ({
    walletConnectCache: { approvalParams: { set: jest.fn() } }
  })
)
jest.mock('services/wallet/WalletService', () => ({
  __esModule: true,
  default: { getPublicKeyFor: jest.fn() }
}))
jest.mock('features/ledger/utils', () => ({
  showLedgerReviewTransaction: jest.fn()
}))
jest.mock('new/routes/store', () => ({
  currentRouteStore: { getState: jest.fn(() => ({ currentRoute: '' })) }
}))
jest.mock('./onApprove', () => ({ onApprove: jest.fn() }))
jest.mock('./onReject', () => ({ onReject: jest.fn() }))
jest.mock('./utils', () => ({ handleLedgerErrorAndShowAlert: jest.fn() }))
jest.mock('common/consts', () => ({ CONFETTI_DURATION_MS: 3000 }))

// ─── Typed mock aliases ────────────────────────────────────────────────────────

const mockIsToastsAndConfettiEnabled = isToastsAndConfettiEnabled as jest.Mock
const mockIsInAppAvalancheRequest = isInAppAvalancheRequest as jest.Mock
const mockIsConfettiEnabled = isConfettiEnabled as jest.Mock
const mockIsInAppReview = isInAppReview as jest.Mock
const mockShowConfetti = showConfetti as jest.Mock
const mockIsInAppRequest = isInAppRequest as jest.Mock
const mockOnApprove = onApprove as jest.Mock
const mockOnReject = onReject as jest.Mock
const mockRouter = router as jest.Mocked<typeof router>
const mockCurrentRouteStore = currentRouteStore as jest.Mocked<
  typeof currentRouteStore
>
const mockShowLedgerReviewTransaction = showLedgerReviewTransaction as jest.Mock
const mockWalletConnectCacheSet = walletConnectCache.approvalParams
  .set as jest.Mock
const mockGetPublicKeyFor = jest.requireMock('services/wallet/WalletService')
  .default.getPublicKeyFor as jest.Mock
const mockDisconnect = jest.requireMock('services/ledger/LedgerService').default
  .disconnect as jest.Mock

// ─── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(overrides: Partial<RpcRequest> = {}): RpcRequest {
  return {
    requestId: 'req-1',
    chainId: 'eip155:43114',
    context: {},
    ...overrides
  } as unknown as RpcRequest
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('ApprovalController', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsToastsAndConfettiEnabled.mockReturnValue(true)
    mockIsInAppAvalancheRequest.mockReturnValue(false)
    mockIsConfettiEnabled.mockReturnValue(true)
    mockIsInAppReview.mockReturnValue(false)
    mockIsInAppRequest.mockReturnValue(false)
  })

  // ── onTransactionPending ──────────────────────────────────────────────────

  describe('onTransactionPending', () => {
    const pendingArgs = (request: RpcRequest) => ({
      txHash: '0xabc',
      request,
      explorerLink: 'https://example.com'
    })

    it('does nothing when toasts and confetti are disabled', () => {
      mockIsToastsAndConfettiEnabled.mockReturnValue(false)

      approvalController.onTransactionPending(pendingArgs(makeRequest()))

      expect(transactionSnackbar.success).not.toHaveBeenCalled()
      expect(transactionSnackbar.pending).not.toHaveBeenCalled()
      expect(mockShowConfetti).not.toHaveBeenCalled()
    })

    it('shows success toast and confetti for in-app Avalanche requests', () => {
      mockIsInAppAvalancheRequest.mockReturnValue(true)

      approvalController.onTransactionPending(pendingArgs(makeRequest()))

      expect(transactionSnackbar.success).toHaveBeenCalledWith({
        message: 'Transaction sent'
      })
      expect(mockShowConfetti).toHaveBeenCalledTimes(1)
      expect(transactionSnackbar.pending).not.toHaveBeenCalled()
    })

    it('skips confetti when confetti is disabled for in-app Avalanche requests', () => {
      mockIsInAppAvalancheRequest.mockReturnValue(true)
      mockIsConfettiEnabled.mockReturnValue(false)

      approvalController.onTransactionPending(pendingArgs(makeRequest()))

      expect(transactionSnackbar.success).toHaveBeenCalled()
      expect(mockShowConfetti).not.toHaveBeenCalled()
    })

    it('shows pending toast for non-Avalanche / non-in-app requests', () => {
      const request = makeRequest()

      approvalController.onTransactionPending(pendingArgs(request))

      expect(transactionSnackbar.pending).toHaveBeenCalledWith({
        toastId: request.requestId
      })
      expect(transactionSnackbar.success).not.toHaveBeenCalled()
    })
  })

  // ── onTransactionConfirmed ────────────────────────────────────────────────

  describe('onTransactionConfirmed', () => {
    jest.useFakeTimers()

    const confirmedArgs = (request: RpcRequest) => ({
      explorerLink: 'https://example.com',
      request
    })

    it('does nothing when toasts and confetti are disabled', () => {
      mockIsToastsAndConfettiEnabled.mockReturnValue(false)

      approvalController.onTransactionConfirmed(confirmedArgs(makeRequest()))

      expect(transactionSnackbar.success).not.toHaveBeenCalled()
      expect(mockShowConfetti).not.toHaveBeenCalled()
      expect(
        promptForAppReviewAfterSuccessfulTransaction
      ).not.toHaveBeenCalled()
    })

    it('schedules app-review prompt when isInAppReview is true', () => {
      mockIsInAppReview.mockReturnValue(true)

      approvalController.onTransactionConfirmed(confirmedArgs(makeRequest()))

      jest.runAllTimers()

      expect(
        promptForAppReviewAfterSuccessfulTransaction
      ).toHaveBeenCalledTimes(1)
    })

    it('does not show success toast for in-app Avalanche requests (already shown in pending)', () => {
      mockIsInAppAvalancheRequest.mockReturnValue(true)

      approvalController.onTransactionConfirmed(confirmedArgs(makeRequest()))

      expect(transactionSnackbar.success).not.toHaveBeenCalled()
    })

    it('shows success toast with explorerLink for non-Avalanche requests', () => {
      const request = makeRequest()
      const explorerLink = 'https://explorer.example.com'

      approvalController.onTransactionConfirmed({ explorerLink, request })

      expect(transactionSnackbar.success).toHaveBeenCalledWith({
        explorerLink,
        toastId: request.requestId
      })
    })

    it('shows confetti for in-app non-Avalanche requests when confetti is enabled', () => {
      mockIsInAppRequest.mockReturnValue(true)

      approvalController.onTransactionConfirmed(confirmedArgs(makeRequest()))

      expect(mockShowConfetti).toHaveBeenCalledTimes(1)
    })

    it('skips confetti when confetti is disabled', () => {
      mockIsInAppRequest.mockReturnValue(true)
      mockIsConfettiEnabled.mockReturnValue(false)

      approvalController.onTransactionConfirmed(confirmedArgs(makeRequest()))

      expect(mockShowConfetti).not.toHaveBeenCalled()
    })

    it('skips confetti for non-in-app requests', () => {
      mockIsInAppRequest.mockReturnValue(false)

      approvalController.onTransactionConfirmed(confirmedArgs(makeRequest()))

      expect(mockShowConfetti).not.toHaveBeenCalled()
    })
  })

  // ── onTransactionReverted ─────────────────────────────────────────────────

  describe('onTransactionReverted', () => {
    it('shows an error toast', () => {
      approvalController.onTransactionReverted()

      expect(transactionSnackbar.error).toHaveBeenCalledWith({
        error: 'Transaction reverted'
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
        setCurrentRoute: jest.fn()
      })
      mockRouter.canGoBack.mockReturnValue(true)

      approvalController.handleGoBackIfNeeded()

      expect(mockRouter.back).toHaveBeenCalledTimes(1)
    })

    it('goes back when on the ledgerReviewTransaction screen and canGoBack is true', () => {
      mockCurrentRouteStore.getState.mockReturnValue({
        currentRoute: '/ledgerReviewTransaction',
        setCurrentRoute: jest.fn()
      })
      mockRouter.canGoBack.mockReturnValue(true)

      approvalController.handleGoBackIfNeeded()

      expect(mockRouter.back).toHaveBeenCalledTimes(1)
    })

    it('does not go back when canGoBack is false', () => {
      mockCurrentRouteStore.getState.mockReturnValue({
        currentRoute: '/approval',
        setCurrentRoute: jest.fn()
      })
      mockRouter.canGoBack.mockReturnValue(false)

      approvalController.handleGoBackIfNeeded()

      expect(mockRouter.back).not.toHaveBeenCalled()
    })

    it('does not go back when on an unrelated route', () => {
      mockCurrentRouteStore.getState.mockReturnValue({
        currentRoute: '/home',
        setCurrentRoute: jest.fn()
      })
      mockRouter.canGoBack.mockReturnValue(true)

      approvalController.handleGoBackIfNeeded()

      expect(mockRouter.back).not.toHaveBeenCalled()
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

      // Capture the onApprove callback set in walletConnectCache
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

    it('shows Ledger review screen for LEDGER wallet type', async () => {
      const request = makeApprovalRequest()
      approvalController.requestApproval({ request, displayData, signingData })

      const { onApprove: capturedOnApprove } =
        mockWalletConnectCacheSet.mock.calls[0][0]
      const params = { walletType: WalletType.LEDGER } as never
      await capturedOnApprove(params)

      expect(mockShowLedgerReviewTransaction).toHaveBeenCalledTimes(1)
    })

    it('shows Ledger review screen for LEDGER_LIVE wallet type', async () => {
      const request = makeApprovalRequest()
      approvalController.requestApproval({ request, displayData, signingData })

      const { onApprove: capturedOnApprove } =
        mockWalletConnectCacheSet.mock.calls[0][0]
      const params = { walletType: WalletType.LEDGER_LIVE } as never
      await capturedOnApprove(params)

      expect(mockShowLedgerReviewTransaction).toHaveBeenCalledTimes(1)
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
  })
})
