import { WCSessionProposal } from 'store/walletConnectV2/types'
import { AppListenerEffectAPI } from 'store/types'
import { RpcError } from '@avalabs/vm-module-types'
import { uuid } from 'utils/uuid'
import type { QuickSwapMaxBuy } from 'store/settings/advanced/types'

export interface PeerMeta {
  name: string
  description: string
  url: string
  icons: string[]
}

export type RpcRequest<Method extends RpcMethod> = {
  data: {
    id: number
    topic: string
    params: {
      request: {
        method: Method
        params: unknown
      }
      chainId: string
    }
  }
  method: Method
  peerMeta: PeerMeta
  provider: RpcProvider

  // only used by in-app requests to pass additional context
  // to display in the approval screen
  context?: Record<string, unknown>
}

export type Request = RpcRequest<RpcMethod> | WCSessionProposal

export type RpcState = {
  requestStatuses: Record<string, RequestStatus>
}

export enum RpcMethod {
  /* standard methods */
  ETH_REQUEST_ACCOUNTS = 'eth_requestAccounts',
  ETH_SEND_TRANSACTION = 'eth_sendTransaction',
  // In-app only — not declared in the WC namespace allowlist.
  ETH_SEND_TRANSACTION_BATCH = 'eth_sendTransactionBatch',
  SIGN_TYPED_DATA_V3 = 'eth_signTypedData_v3',
  SIGN_TYPED_DATA_V4 = 'eth_signTypedData_v4',
  SIGN_TYPED_DATA_V1 = 'eth_signTypedData_v1',
  SIGN_TYPED_DATA = 'eth_signTypedData',
  PERSONAL_SIGN = 'personal_sign',
  ETH_SIGN = 'eth_sign',
  WALLET_ADD_ETHEREUM_CHAIN = 'wallet_addEthereumChain',
  WALLET_GET_ETHEREUM_CHAIN = 'wallet_getEthereumChain',
  WALLET_SWITCH_ETHEREUM_CHAIN = 'wallet_switchEthereumChain',
  WALLET_WATCH_ASSET = 'wallet_watchAsset',

  /* custom methods that are proprietary to Core */
  AVALANCHE_CREATE_CONTACT = 'avalanche_createContact',
  AVALANCHE_GET_ACCOUNTS = 'avalanche_getAccounts',
  AVALANCHE_GET_ACCOUNT_PUB_KEY = 'avalanche_getAccountPubKey',
  AVALANCHE_GET_BRIDGE_STATE = 'avalanche_getBridgeState',
  AVALANCHE_GET_CONTACTS = 'avalanche_getContacts',
  AVALANCHE_REMOVE_CONTACT = 'avalanche_removeContact',
  AVALANCHE_SELECT_ACCOUNT = 'avalanche_selectAccount',
  AVALANCHE_SET_DEVELOPER_MODE = 'avalanche_setDeveloperMode',
  AVALANCHE_UPDATE_CONTACT = 'avalanche_updateContact',
  AVALANCHE_SEND_TRANSACTION = 'avalanche_sendTransaction',
  AVALANCHE_SIGN_TRANSACTION = 'avalanche_signTransaction',
  AVALANCHE_GET_ADDRESSES_IN_RANGE = 'avalanche_getAddressesInRange',
  BITCOIN_SEND_TRANSACTION = 'bitcoin_sendTransaction',
  BITCOIN_SIGN_TRANSACTION = 'bitcoin_signTransaction',
  AVALANCHE_SIGN_MESSAGE = 'avalanche_signMessage',
  AVALANCHE_RENAME_ACCOUNT = 'avalanche_renameAccount',
  WALLET_GET_NETWORK_STATE = 'wallet_getNetworkState',
  WALLET_ENABLE_NETWORK = 'wallet_enableNetwork',
  AVALANCHE_ADD_ACCOUNT = 'avalanche_addAccount',

  /* Solana methods */
  SOLANA_SIGN_AND_SEND_TRANSACTION = 'solana_signAndSendTransaction',
  SOLANA_SIGN_TRANSACTION = 'solana_signTransaction',
  SOLANA_SIGN_MESSAGE = 'solana_signMessage',

  /* custom methods that only apply to Wallet Connect*/
  WC_SESSION_REQUEST = 'wc_sessionRequest'
}

export const CORE_EVM_METHODS = [
  RpcMethod.AVALANCHE_CREATE_CONTACT,
  RpcMethod.AVALANCHE_GET_ACCOUNT_PUB_KEY,
  RpcMethod.AVALANCHE_GET_ACCOUNTS,
  RpcMethod.AVALANCHE_GET_BRIDGE_STATE,
  RpcMethod.AVALANCHE_GET_CONTACTS,
  RpcMethod.AVALANCHE_REMOVE_CONTACT,
  RpcMethod.AVALANCHE_SELECT_ACCOUNT,
  RpcMethod.AVALANCHE_SET_DEVELOPER_MODE,
  RpcMethod.AVALANCHE_UPDATE_CONTACT,
  RpcMethod.AVALANCHE_GET_ADDRESSES_IN_RANGE,
  RpcMethod.AVALANCHE_RENAME_ACCOUNT,
  RpcMethod.AVALANCHE_ADD_ACCOUNT
]

export const CORE_AVAX_METHODS = [
  RpcMethod.AVALANCHE_SEND_TRANSACTION,
  RpcMethod.AVALANCHE_SIGN_TRANSACTION,
  RpcMethod.AVALANCHE_SIGN_MESSAGE
]

export const CORE_WALLET_METHODS = [
  RpcMethod.WALLET_GET_NETWORK_STATE,
  RpcMethod.WALLET_ENABLE_NETWORK
]

export const CORE_BTC_METHODS = [
  RpcMethod.BITCOIN_SEND_TRANSACTION,
  RpcMethod.BITCOIN_SIGN_TRANSACTION
]

export const SOLANA_METHODS = [
  RpcMethod.SOLANA_SIGN_MESSAGE,
  RpcMethod.SOLANA_SIGN_TRANSACTION,
  RpcMethod.SOLANA_SIGN_AND_SEND_TRANSACTION
]

export type ConfirmationReceiptStatus = 'Reverted' | 'Success' | 'Pending'

export type RequestStatus = {
  result?: {
    txHash: string
    confirmationReceiptStatus?: ConfirmationReceiptStatus
  }
  error?: Error
}

export enum RpcProvider {
  WALLET_CONNECT = 'wallet_connect',
  CORE_MOBILE = 'core_mobile'
}

export interface AgnosticRpcProvider {
  provider: RpcProvider
  onError: ({
    request,
    error,
    listenerApi
  }: {
    request: Request
    error: RpcError
    listenerApi: AppListenerEffectAPI
  }) => Promise<void>
  onSuccess: ({
    request,
    result,
    listenerApi
  }: {
    request: Request
    result: unknown
    listenerApi: AppListenerEffectAPI
  }) => Promise<void>
  validateRequest: (request: Request, listenerApi: AppListenerEffectAPI) => void
}

// this is the session id for all Core Mobile in-app requests
// it stays the same during an app session
export const CORE_MOBILE_TOPIC = uuid()

export const CORE_MOBILE_META: PeerMeta = {
  name: 'Core',
  description: 'Core Mobile Wallet',
  url: 'https://core.app/',
  icons: ['https://core.app/favicon.ico']
}

// request context keys for in-app requests
export enum RequestContext {
  // used to disable confetti on transaction confirmation
  CONFETTI_DISABLED = 'confettiDisabled',

  // used to determine if the recipient/to address is a contract
  // If we set an address for this key, the approval screen will show “To” instead of “Contract” along with the address.
  NON_CONTRACT_RECIPIENT_ADDRESS = 'nonContractRecipient',

  // used to signal VM-module retry for gasless C-chain sends
  SHOULD_RETRY = 'shouldRetry',

  // used to signal that the in-app review logic should be triggered
  IN_APP_REVIEW = 'inAppReview',

  // used to suppress all transaction feedback (toasts, confetti, in-app review) for
  // intermediate or cross-chain swap steps
  SUPPRESS_TX_FEEDBACK = 'suppressTxFeedback',

  // used to suppress only the success toast on confirmation, while still allowing the
  // pending toast — confetti is controlled separately by CONFETTI_DISABLED
  SUCCESS_TOAST_DISABLED = 'successToastDisabled',

  // used to show "Transaction sent" immediately in onTransactionPending instead of a
  // pending toast — used when no confirmed toast will follow (e.g. Fusion same-chain swap)
  IMMEDIATE_SENT_TOAST = 'immediateSentToast',

  // Snapshot of the `sae-override` PostHog feature flag, captured at request
  // creation time by createInAppRequest. Read by isOptimisticConfirmationEnabled
  // to short-circuit the InfoAPI Helicon check. See createInAppRequest for the
  // rationale on threading this via context instead of a service-level read.
  SAE_OVERRIDE = 'saeOverride',

  // Quick Swaps bypass intent — consumed by SwapValidator and
  // BatchSwapValidator to decide whether a Markr swap can skip the
  // /approval modal.
  SWAP_AUTO_APPROVE = 'swapAutoApprove',

  // Carries the BatchSwapValidator's reason to the per-tx fallback flow
  // so the manual modal can render "Manual approval required: <reason>".
  QUICK_SWAPS_MANUAL_REVIEW_REASON = 'quickSwapsManualReviewReason',

  // Snapshot of the `fusion-quick-swaps` PostHog flag at in-app request
  // creation time. The validator re-checks this so a kill-switch flip
  // refuses bypass even if a stale SWAP_AUTO_APPROVE context arrives
  // from a code path that didn't go through the live-state-aware signer.
  QUICK_SWAPS_AVAILABLE = 'quickSwapsAvailable',

  // Recurring-swap (DCA) approval context. Present on both the ERC-20
  // allowance approval and the first-fill eth_sendTransaction. The
  // `step` discriminator separates the two so the post-confirmation
  // listener (Task 21) knows when to persist a schedule.
  RECURRING_SWAP = 'recurringSwap'
}

// Presence of `SWAP_AUTO_APPROVE` in request.context signals bypass
// intent. Fields below are inputs the validator consumes.
export type SwapAutoApproveContext = {
  maxBuy?: QuickSwapMaxBuy
  srcTokenAddress?: string
  destTokenAddress?: string
  isSrcTokenNative?: boolean
  isDestTokenNative?: boolean
  // Basis points (e.g. 50 = 0.5%).
  slippage?: number
  minAmountOut?: string
  // Used to net out gas burn from source-side diff on native swaps.
  amountIn?: string
  // Quote-attested partner fee (basis points). Validator adds this to
  // the slippage tolerance for the USD-loss check. Passing the actual
  // value (not just a boolean) means we tolerate exactly the fee Markr
  // quoted, not a constant guess. Undefined or 0 = no fee.
  partnerFeeBps?: number
}

/**
 * Recurring-swap approval context attached via RequestContext.RECURRING_SWAP.
 * Present on both the ERC-20 allowance `eth_sendTransaction` and the first-fill
 * `eth_sendTransaction` so the approval screen can render the same Recurrence
 * details on each. The full payload travels through both steps so the
 * tx-confirmation listener (CP-13663 Task 21) can persist the schedule from the
 * `step: 'fill'` confirmation without re-fetching destination-token metadata.
 */
export type RecurringSwapApprovalContext = {
  step: 'approve' | 'fill' // discriminator: ERC-20 allowance vs. first-fill tx
  quoteUuid: string
  fromTokenAddress: string
  fromTokenSymbol: string
  fromTokenDecimals: number
  toTokenAddress: string
  toTokenSymbol: string
  toTokenDecimals: number
  amountPerOrder: string // decimal string in fromToken's smallest unit
  totalAmountIn: string // amount * numberOfOrders; the allowance amount
  numberOfOrders: number // 365 if the user picked Unlimited
  isUnlimited: boolean // true when the UI selected "Unlimited"
  frequency: {
    unit: 'minute' | 'hour' | 'day' | 'week' | 'month'
    value: number
  }
  intervalSeconds: number
  chainId: number
}
