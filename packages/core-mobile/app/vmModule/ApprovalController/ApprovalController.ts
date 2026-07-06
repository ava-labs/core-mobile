import { router } from 'expo-router'
import LedgerService from 'services/ledger/LedgerService'
import {
  ApprovalController as VmModuleApprovalController,
  ApprovalParams,
  ApprovalResponse,
  BatchApprovalParams,
  BatchApprovalResponse,
  RpcRequest,
  RequestPublicKeyParams
} from '@avalabs/vm-module-types'
import { walletConnectCache } from 'services/walletconnectv2/walletConnectCache/walletConnectCache'
import { transactionSnackbar } from 'new/common/utils/toast'
import { isInAppRequest } from 'store/rpc/utils/isInAppRequest'
import {
  isDappOriginatedUrl,
  isInjectedDappRequest
} from 'store/rpc/utils/isDappOriginatedRequest'
import { normalizeAnalyticsAddress } from 'store/rpc/utils/normalizeAnalyticsAddress'
import {
  clearRequestSignal,
  getRequestSignal
} from 'store/rpc/utils/inFlightRequestSignals'
import {
  isTxSendMethod,
  TxSendConfirmedEvent,
  TxSendFailedEvent
} from 'store/rpc/utils/txSendMethods'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { NavigationPresentationMode } from 'new/common/types'
import WalletService from 'services/wallet/WalletService'
import { Curve } from 'utils/publicKeys'
import { ledgerParamsStore } from 'features/ledger/store'
import { OnApproveParams } from 'services/walletconnectv2/walletConnectCache/types'
import { WalletType } from 'services/wallet/types'
import { promptForAppReviewAfterSuccessfulTransaction } from 'features/appReview/utils/promptForAppReviewAfterSuccessfulTransaction'
import { CONFETTI_DURATION_MS } from 'common/consts'
import { currentRouteStore } from 'new/routes/store'
import { BoundedMap } from 'common/utils/boundedMap'
import { getAddressForChainId } from 'store/rpc/handlers/wc_sessionRequest/utils'
import {
  isTxFeedbackEnabled,
  isConfettiEnabled,
  isInAppAvalancheRequest,
  isInAppReview,
  isSuccessToastEnabled,
  isImmediateSentToast,
  showConfetti
} from '../utils/requestContext'
import { isOptimisticConfirmationEnabled } from '../utils/isOptimisticConfirmationEnabled'
import { maybeInjectSiweAlert } from '../utils/siwe/getSiweAlert'
import { onApprove } from './onApprove'
import { onReject } from './onReject'
import { handleLedgerErrorAndShowAlert } from './utils'
import {
  findRequestValidator,
  runBatchApprovalBypass,
  runRequestValidatorBypass
} from './quickSwapsBypass'

// Max concurrently-parked cancellable approvals. Entries are removed on every
// normal settle (clearCancelBridge), so this is a defensive cap; eviction is
// handled with full teardown via freeActiveApprovalCapacity. (CP-14422)
const ACTIVE_APPROVALS_MAX = 10

class ApprovalController implements VmModuleApprovalController {
  private userCancelledMap = new BoundedMap<string, boolean>(10)
  private signingAddressMap = new BoundedMap<string, string>(10)
  // Caches whether the optimistic-confirmation gate said yes/no for a given
  // requestId. Set in onTransactionPending and read in onTransactionConfirmed
  // so the two handlers can never disagree (e.g. if the upstream InfoAPI
  // cache expired or a refetch errored between the two callbacks).
  private optimisticGateMap = new BoundedMap<string, boolean>(20)

  // Parked approvals a cross-origin browser nav can cancel, keyed by requestId
  // (CP-14422). Keyed (not single-slot) so overlapping browser signing requests
  // each keep their own cancel bridge. `phase` gates the uncancellable window:
  // once Ledger on-device signing has begun, a nav must not cancel.
  private activeApprovals = new BoundedMap<
    string,
    {
      resolve: (value: ApprovalResponse | PromiseLike<ApprovalResponse>) => void
      phase: 'parked' | 'ledgerPending' | 'ledgerSigning'
      detach: () => void
    }
  >(ACTIVE_APPROVALS_MAX)

  async requestPublicKey({
    secretId,
    derivationPath,
    curve
  }: RequestPublicKeyParams): Promise<string> {
    const { walletId, walletType } = JSON.parse(secretId)

    return WalletService.getPublicKeyFor({
      walletId,
      walletType: walletType,
      derivationPath,
      curve: curve as Curve
    })
  }

  onTransactionPending = async ({
    txHash: _txHash,
    request,
    explorerLink: _explorerLink
  }: {
    txHash: string
    request: RpcRequest
    explorerLink?: string
  }): Promise<void> => {
    if (!isTxFeedbackEnabled(request)) return

    const showSuccessOptimistically =
      isInAppAvalancheRequest(request) &&
      (await isOptimisticConfirmationEnabled(request))

    // Persist the decision so onTransactionConfirmed reads the same value
    // even if the upstream gate cache has expired or its next fetch errors.
    this.optimisticGateMap.set(request.requestId, showSuccessOptimistically)

    if (showSuccessOptimistically) {
      transactionSnackbar.success({
        message: 'Transaction sent'
      })

      if (isConfettiEnabled(request)) {
        showConfetti()
      }
    } else if (isImmediateSentToast(request)) {
      transactionSnackbar.success({ message: 'Transaction sent' })
    } else {
      transactionSnackbar.pending({ toastId: request.requestId })
    }
  }

  onTransactionConfirmed = ({
    txHash,
    explorerLink,
    request
  }: {
    txHash: string
    explorerLink: string
    request: RpcRequest
  }): void => {
    if (
      isDappOriginatedUrl(request.dappInfo?.url) &&
      isTxSendMethod(request.method)
    ) {
      const address = this.signingAddressMap.get(request.requestId) ?? ''
      this.signingAddressMap.delete(request.requestId)
      const eventName = `${request.method}_confirmed` as TxSendConfirmedEvent
      AnalyticsService.capture(eventName, {
        provider: isInjectedDappRequest(request) ? 'injected' : 'walletConnect',
        encrypted: {
          dAppUrl: request.dappInfo.url,
          address,
          chainId: request.chainId,
          txHash
        }
      })
    }

    // Read & clear the gate decision recorded at pending time. If we somehow
    // missed onTransactionPending (shouldn't happen for normal flows), fall
    // back to non-optimistic so we still emit a success toast on confirmation.
    const wasOptimistic = this.optimisticGateMap.get(request.requestId) ?? false
    this.optimisticGateMap.delete(request.requestId)

    if (!isTxFeedbackEnabled(request)) return

    if (isInAppReview(request)) {
      // Run the app-review prompt flow after confetti finishes
      setTimeout(() => {
        promptForAppReviewAfterSuccessfulTransaction()
      }, CONFETTI_DURATION_MS + 200)
    }

    // For in-app Avalanche requests where the optimistic UI already fired in
    // onTransactionPending, skip to avoid duplicating the success toast.
    if (wasOptimistic) {
      return
    }

    if (isSuccessToastEnabled(request)) {
      transactionSnackbar.success({ explorerLink, toastId: request.requestId })
    }

    // only show confetti for in-app requests
    if (isInAppRequest(request) && isConfettiEnabled(request)) {
      showConfetti()
    }
  }

  onTransactionReverted = ({
    txHash,
    request
  }: {
    txHash: string
    request: RpcRequest
  }): void => {
    transactionSnackbar.error({ error: 'Transaction reverted' })

    // Clear any cached gate decision for this requestId so it doesn't linger.
    this.optimisticGateMap.delete(request.requestId)

    if (
      isDappOriginatedUrl(request.dappInfo?.url) &&
      isTxSendMethod(request.method)
    ) {
      const address = this.signingAddressMap.get(request.requestId) ?? ''
      this.signingAddressMap.delete(request.requestId)
      const eventName = `${request.method}_failed` as TxSendFailedEvent
      AnalyticsService.capture(eventName, {
        provider: isInjectedDappRequest(request) ? 'injected' : 'walletConnect',
        encrypted: {
          dAppUrl: request.dappInfo.url,
          address,
          chainId: request.chainId,
          txHash
        }
      })
    }
  }

  handleLedgerOnReject = ({
    resolve
  }: {
    resolve: (value: ApprovalResponse | PromiseLike<ApprovalResponse>) => void
  }): void => {
    // Settle the request promise FIRST so a slow or hung BLE disconnect can't
    // delay the rejection — the cross-origin abort path exists to settle
    // orphaned promises promptly, and no caller needs the Ledger torn down
    // before the reject. Clear the review store and disconnect BLE
    // fire-and-forget. (CP-14422)
    onReject({ resolve })
    ledgerParamsStore.getState().setReviewTransactionParams(null)
    LedgerService.disconnect().catch(() => undefined)
  }

  // True while any parked approval is mid on-device Ledger signing — the
  // uncancellable window. `cancelParkedApproval` already no-ops in this phase so
  // the signature completes; the cross-origin nav dismissal in `setCurrentUrl`
  // checks this so it doesn't pop the `ledgerReviewTransaction` screen out from
  // under a signature the user is still confirming on the device. Dismissals
  // driven by the controller's own ledger lifecycle (completion / reject) call
  // `handleGoBackIfNeeded` directly and are unaffected. (CP-14422)
  isLedgerSigningInProgress = (): boolean => {
    for (const entry of this.activeApprovals.values()) {
      if (entry.phase === 'ledgerSigning') return true
    }
    return false
  }

  // `excludeApproval` skips the `approval` route: the approval screen now
  // dismisses itself (event-driven on its request's AbortSignal) when a
  // cross-origin nav cancels it, so the nav-path caller must NOT also pop it or
  // the two race into a double `router.back()`. The controller's own ledger
  // settle paths still pass no option, so they dismiss `approval` as before.
  // (CP-14422)
  handleGoBackIfNeeded = (options?: { excludeApproval?: boolean }): void => {
    const currentRoute = currentRouteStore.getState().currentRoute
    if (!router.canGoBack()) return
    if (
      currentRoute?.endsWith('ledgerReviewTransaction') ||
      (!options?.excludeApproval && currentRoute?.endsWith('approval')) ||
      currentRoute?.endsWith('addEthereumChain') ||
      currentRoute?.endsWith('authorizeInjectedDapp') ||
      currentRoute?.endsWith('authorizeDapp') ||
      currentRoute?.endsWith('watchAsset')
    ) {
      router.back()
    }
  }

  // Bridge a parked approval to its request's AbortSignal so a cross-origin
  // browser nav (which aborts the request) settles the otherwise-orphaned
  // approval promise. Only browser signing requests register a signal, so WC /
  // signal-less in-app approvals are not affected. Returns true if the request
  // was already aborted and cancelled synchronously, so the caller skips
  // navigating to a modal that would immediately be stale. (CP-14422)
  private registerCancelBridge(
    requestId: string,
    resolve: (value: ApprovalResponse | PromiseLike<ApprovalResponse>) => void
  ): boolean {
    const signal = getRequestSignal(requestId)
    if (!signal) return false

    const onAbort = (): void => this.cancelParkedApproval(requestId)
    const detach = (): void => {
      signal.removeEventListener('abort', onAbort)
      clearRequestSignal(requestId)
    }
    // Free a slot ourselves before inserting: BoundedMap would FIFO-evict the
    // oldest via a plain delete() that skips detach() + promise settlement,
    // leaking the abort listener + request signal and orphaning the parked
    // promise. (CP-14422)
    this.freeActiveApprovalCapacity(requestId)
    this.activeApprovals.set(requestId, { resolve, phase: 'parked', detach })

    // Aborted in the window between request creation and parking the modal:
    // cancel now and tell the caller not to open the modal.
    if (signal.aborted) {
      this.cancelParkedApproval(requestId)
      return true
    }
    signal.addEventListener('abort', onAbort, { once: true })
    return false
  }

  // Make room for an incoming entry without BoundedMap's silent FIFO eviction,
  // which would plain-delete the oldest and skip its detach()/settlement. Cancel
  // the oldest *cancellable* approval instead so its abort listener + request
  // signal are cleaned up and its promise is settled (rejected).
  //
  // We must skip `ledgerSigning` entries: cancelParkedApproval no-ops on those
  // (never cancel mid-device-signing), so picking one would leave the map full
  // and let the subsequent set() fall through to BoundedMap's silent delete() —
  // dropping the in-progress signing entry and leaking its listener/signal. With
  // a single Ledger device at most one entry is ever ledgerSigning, so a
  // cancellable victim effectively always exists; if somehow none does,
  // BoundedMap's own cap remains the backstop. (CP-14422)
  private freeActiveApprovalCapacity(incomingKey: string): void {
    if (
      this.activeApprovals.has(incomingKey) ||
      this.activeApprovals.size < ACTIVE_APPROVALS_MAX
    ) {
      return
    }
    for (const [key, entry] of this.activeApprovals) {
      if (entry.phase !== 'ledgerSigning') {
        this.cancelParkedApproval(key)
        return
      }
    }
  }

  private setApprovalPhase(
    requestId: string,
    phase: 'parked' | 'ledgerPending' | 'ledgerSigning'
  ): void {
    const entry = this.activeApprovals.get(requestId)
    if (entry) entry.phase = phase
  }

  private clearCancelBridge(requestId: string): void {
    const entry = this.activeApprovals.get(requestId)
    if (!entry) return
    entry.detach()
    this.activeApprovals.delete(requestId)
  }

  // Cancel a parked approval whose request was aborted. Runs the REAL reject so
  // the orphaned promise settles and Ledger BLE + store are torn down; once
  // on-device Ledger signing has begun (`ledgerSigning`) the cancel is a no-op.
  //
  // Screen DISMISSAL is intentionally NOT done here: the caller
  // (setCurrentUrl's cross-origin branch) already calls `handleGoBackIfNeeded`
  // — the generic dismissal for every modal type — right after aborting. Since
  // the abort fires this synchronously, dismissing here too would double
  // `router.back()`. Settlement and dismissal stay separate. (CP-14422)
  private cancelParkedApproval(requestId: string): void {
    const entry = this.activeApprovals.get(requestId)
    if (!entry || entry.phase === 'ledgerSigning') return

    // Mark cancelled so a late Approve tap can't sign/broadcast (guarded in the
    // cache `onApprove`) and Ledger retry alerts stay suppressed.
    this.userCancelledMap.set(requestId, true)
    if (entry.phase === 'ledgerPending') {
      this.handleLedgerOnReject({ resolve: entry.resolve })
    } else {
      onReject({ resolve: entry.resolve })
    }
    this.clearCancelBridge(requestId)
  }

  private cacheSigningAddress(
    requestId: string,
    chainId: string,
    account: OnApproveParams['account']
  ): void {
    const address = getAddressForChainId(chainId, account)
    if (address) {
      // Normalize so _confirmed / _failed report the same casing as _success
      // (which may use the dApp-supplied tx `from`). Hex-only; non-EVM addresses
      // are left untouched. CP-13825.
      this.signingAddressMap.set(requestId, normalizeAnalyticsAddress(address))
    }
  }

  private handleLedgerApproval({
    requestId,
    request,
    params,
    signingData,
    resolve
  }: {
    requestId: string
    request: ApprovalParams['request']
    params: OnApproveParams
    signingData: ApprovalParams['signingData']
    resolve: (value: ApprovalResponse | PromiseLike<ApprovalResponse>) => void
  }): void {
    // Ledger sheet is up: still cancellable (BLE connecting), until on-device
    // signing actually begins below. (CP-14422)
    this.setApprovalPhase(requestId, 'ledgerPending')

    const resolveWithRetry = (
      value: ApprovalResponse | PromiseLike<ApprovalResponse>
    ): void => {
      if ('error' in value) {
        // Don't show alert if user explicitly cancelled
        if (this.userCancelledMap.get(requestId)) {
          this.userCancelledMap.delete(requestId)
          return
        }

        // On-device signing failed but is retryable; while the Retry/Cancel
        // alert is up we're waiting on the user again, so a cross-origin nav
        // must be able to cancel (tear down BLE + settle) — drop back out of
        // the uncancellable `ledgerSigning` phase. (CP-14422)
        this.setApprovalPhase(requestId, 'ledgerPending')

        handleLedgerErrorAndShowAlert({
          error: value.error,
          network: params.network,
          rpcMethod: request.method,
          onRetry: () => {
            // Guard: if the approval sheet was dismissed while the alert was
            // visible, userCancelledMap will be set — don't retry in that case.
            if (this.userCancelledMap.get(requestId)) {
              this.userCancelledMap.delete(requestId)
              return
            }
            // Retrying restarts on-device signing — uncancellable again.
            this.setApprovalPhase(requestId, 'ledgerSigning')
            onApprove({
              ...params,
              signingData,
              resolve: resolveWithRetry
            })
          },
          onCancel: () => {
            this.userCancelledMap.set(requestId, true)
            this.handleGoBackIfNeeded()
            this.handleLedgerOnReject({ resolve })
            this.clearCancelBridge(requestId)
          }
        })
      } else {
        resolve(value)
        ledgerParamsStore.getState().setReviewTransactionParams(null)
        this.handleGoBackIfNeeded()
        this.userCancelledMap.delete(requestId)
        this.clearCancelBridge(requestId)
      }
    }

    ledgerParamsStore.getState().setReviewTransactionParams({
      rpcMethod: request.method,
      network: params.network,
      onApprove: () => {
        // On-device signing begins — uncancellable from here. (CP-14422)
        this.setApprovalPhase(requestId, 'ledgerSigning')
        // Defensive: a signing handler that rejects WITHOUT ever calling resolve
        // would otherwise strand this entry in `ledgerSigning` — wedging
        // isLedgerSigningInProgress() so cross-origin dismissal silently dies
        // app-wide. Drop back to `ledgerPending` on such a throw so a nav can
        // still cancel + tear down (and re-throw to preserve the UI's existing
        // error handling). Promise.resolve wraps the (mockable) call so a
        // non-promise return is handled too. (CP-14422)
        return Promise.resolve(
          onApprove({ ...params, signingData, resolve: resolveWithRetry })
        ).catch(error => {
          this.setApprovalPhase(requestId, 'ledgerPending')
          throw error
        })
      },
      onReject: (_message?: string) => {
        this.userCancelledMap.set(requestId, true)
        this.handleLedgerOnReject({ resolve })
        this.handleGoBackIfNeeded()
        this.clearCancelBridge(requestId)
      }
    })
  }

  private async handleApprovalApprove({
    requestId,
    request,
    signingData,
    resolve,
    params
  }: {
    requestId: string
    request: ApprovalParams['request']
    signingData: ApprovalParams['signingData']
    resolve: (value: ApprovalResponse | PromiseLike<ApprovalResponse>) => void
    params: OnApproveParams
  }): Promise<void> {
    // A cross-origin nav may have cancelled this request while the modal was
    // up; a late Approve tap must not sign/broadcast. (CP-14422)
    if (this.userCancelledMap.get(requestId)) return

    // Cache the actual selected signer so onTransactionConfirmed /
    // onTransactionReverted emit the real address for dApp txs — including
    // the injected browser (which the !isInAppRequest gate excluded,
    // making those events fire with an empty address). CP-13825.
    if (
      isDappOriginatedUrl(request.dappInfo?.url) &&
      isTxSendMethod(request.method)
    ) {
      this.cacheSigningAddress(requestId, request.chainId, params.account)
    }

    if (
      params.walletType === WalletType.LEDGER ||
      params.walletType === WalletType.LEDGER_LIVE
    ) {
      this.handleLedgerApproval({
        requestId,
        request,
        params,
        signingData,
        resolve
      })
    } else {
      // Standard signing starts now — past the cancellable window.
      this.clearCancelBridge(requestId)
      await onApprove({ ...params, resolve, signingData })
    }
  }

  async requestApproval(params: ApprovalParams): Promise<ApprovalResponse> {
    const { request, displayData, signingData } = params
    const requestId = request.requestId
    this.userCancelledMap.delete(requestId)

    // Quick Swaps bypass — sync find then async run keeps the common
    // (no-validator) path microtask-free so the modal navigation
    // below happens on the same tick callers observe.
    const validator = findRequestValidator(params)
    if (validator) {
      const bypassResult = await runRequestValidatorBypass(validator, params)
      if (bypassResult) return bypassResult
    }

    const enrichedDisplayData = maybeInjectSiweAlert({
      request,
      signingData,
      displayData
    })

    return new Promise<ApprovalResponse>(resolve => {
      // Settle (and clean up Ledger BLE) if this request is cancelled by a
      // cross-origin nav while the modal is parked. No-op for non-browser
      // requests (they register no AbortSignal). If the request was already
      // aborted before we got here (nav landed in the pre-park window), it's
      // cancelled synchronously via the resolve we hand it — return BEFORE
      // caching params or navigating, so we neither open a stale modal nor leave
      // the parked callbacks (incl. this resolve closure) + request data sitting
      // in the single-slot cache with nothing to consume/clear them. (CP-14422)
      if (this.registerCancelBridge(requestId, resolve)) return

      walletConnectCache.approvalParams.set({
        request,
        displayData: enrichedDisplayData,
        signingData,
        // Hand the screen the request's signal so it can self-dismiss on mount
        // if a cross-origin nav already cancelled it (the generic pop can race
        // the mount and miss). Undefined for non-browser requests. (CP-14422)
        signal: getRequestSignal(requestId),
        onApprove: (approveParams: OnApproveParams) =>
          this.handleApprovalApprove({
            requestId,
            request,
            signingData,
            resolve,
            params: approveParams
          }),
        onReject: (message?: string) => {
          this.clearCancelBridge(requestId)
          onReject({ resolve, message })
        }
      })

      router.navigate({
        pathname: '/approval',
        params: {
          presentationMode: isInAppRequest(request)
            ? NavigationPresentationMode.FORM_SHEET
            : undefined
        }
      })
    })
  }

  // Batch approvals only exist for the Quick Swaps bypass — there's
  // no batch manual-modal flow in this app. Delegate fully.
  async requestBatchApproval(
    params: BatchApprovalParams
  ): Promise<BatchApprovalResponse> {
    return runBatchApprovalBypass(params)
  }
}

const approvalController = new ApprovalController()

export { approvalController }
