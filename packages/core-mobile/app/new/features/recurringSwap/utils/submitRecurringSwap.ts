import { ethers } from 'ethers'
import { RpcMethod } from '@avalabs/vm-module-types'
import { RequestContext } from 'store/rpc/types'
import { getEvmCaip2ChainId } from 'utils/caip2ChainIds'
import type { Request } from 'store/rpc/utils/createInAppRequest'
import { getRecurringSwapService } from '../services/RecurringSwapService.singleton'
import {
  fetchRouterAddress,
  readErc20Allowance
} from '../services/AllowanceService'
import type { RecurringQuoteResult } from '../services/types'
import type { Frequency, NumberOfOrders } from '../types'
import { UNLIMITED_ORDERS } from '../types'

// ─── ERC-20 approve calldata builder ─────────────────────────────────────────

const ERC20_APPROVE_IFACE = new ethers.Interface([
  'function approve(address spender, uint256 amount) external returns (bool)'
])

function buildErc20ApproveCalldata(spender: string, amount: bigint): string {
  return ERC20_APPROVE_IFACE.encodeFunctionData('approve', [spender, amount])
}

// ─── Frequency → intervalSeconds ─────────────────────────────────────────────

const UNIT_TO_SECONDS: Record<Frequency['unit'], number> = {
  minute: 60,
  hour: 3_600,
  day: 86_400,
  week: 604_800,
  month: 2_592_000
}

function intervalSecondsOf(f: Frequency): number {
  return f.value * UNIT_TO_SECONDS[f.unit]
}

// ─── Public types ─────────────────────────────────────────────────────────────

export type SubmitRecurringSwapParams = {
  /** The `request` function from `useInAppRequest()`. */
  request: Request
  quote: RecurringQuoteResult
  activeAccount: { addressC: string }
  fromToken: {
    address: string
    symbol: string
    decimals: number
    networkChainId: number
  }
  toToken: {
    address: string
    symbol: string
    decimals: number
    networkChainId: number
  }
  frequency: Frequency
  numberOfOrders: NumberOfOrders
  amountPerOrder: bigint
  /**
   * Slippage in basis points (e.g. 50 = 0.5%).
   * Pass undefined to let the server use its recommended value.
   */
  slippageBps?: number
}

// ─── submitRecurringSwap ──────────────────────────────────────────────────────

/**
 * Executes the recurring-swap submission flow:
 *
 * 1. Fetches the Markr router (spender) address.
 * 2. Reads the current ERC-20 allowance.
 * 3. If the allowance is insufficient, dispatches an ERC-20 `approve` tx
 *    through ApprovalController so the modal renders.
 * 4. Calls `POST /recurring/swap` with `{ uuid, appId }` (Markr v2.0.0 body).
 * 5. Dispatches the returned first-fill tx through ApprovalController.
 *
 * The post-confirmation listener (Task 21) handles schedule persistence,
 * analytics, and success toast after the `step: 'fill'` tx confirms.
 *
 * @throws When either ApprovalController tx is rejected by the user, or when
 *   any network call fails.
 */
export async function submitRecurringSwap(
  params: SubmitRecurringSwapParams
): Promise<void> {
  const {
    request,
    quote,
    activeAccount,
    fromToken,
    toToken,
    frequency,
    numberOfOrders,
    amountPerOrder
  } = params

  const chainId = fromToken.networkChainId
  const caip2ChainId = getEvmCaip2ChainId(chainId)
  const isUnlimited = numberOfOrders === UNLIMITED_ORDERS

  // ── Step 0: fetch router address ──────────────────────────────────────────
  const router = await fetchRouterAddress(chainId)

  // ── Step 1: allowance check ───────────────────────────────────────────────
  const allowance = await readErc20Allowance({
    chainId,
    token: fromToken.address,
    owner: activeAccount.addressC,
    spender: router
  })

  // IMPORTANT: baseContext must match RecurringSwapApprovalContext exactly.
  // The schema (validators/shared.ts) is .strict() — extra keys cause silent
  // validation failure, which would break RecurrenceDetails render in
  // ApprovalScreen and the Task 21 confirmation listener.
  const baseContext = {
    quoteUuid: quote.uuid,
    fromTokenAddress: fromToken.address,
    fromTokenSymbol: fromToken.symbol,
    fromTokenDecimals: fromToken.decimals,
    toTokenAddress: toToken.address,
    toTokenSymbol: toToken.symbol,
    toTokenDecimals: toToken.decimals,
    amountPerOrder: amountPerOrder.toString(),
    totalAmountIn: quote.totalAmountIn,
    numberOfOrders: quote.numberOfOrders,
    isUnlimited,
    frequency,
    intervalSeconds: intervalSecondsOf(frequency),
    chainId
    // intentionally NOT in baseContext: slippageBps (used only at quote build time)
  }

  // ── Step 2: ERC-20 approve (if needed) ───────────────────────────────────
  if (allowance < BigInt(quote.totalAmountIn)) {
    await request({
      method: RpcMethod.ETH_SEND_TRANSACTION,
      params: [
        {
          from: activeAccount.addressC,
          to: fromToken.address,
          data: buildErc20ApproveCalldata(
            router,
            BigInt(quote.totalAmountIn)
          ),
          value: '0x0'
        }
      ],
      chainId: caip2ChainId,
      context: {
        [RequestContext.RECURRING_SWAP]: {
          ...baseContext,
          step: 'approve' as const
        }
      }
    })
  }

  // ── Step 3: first-fill via Markr v2.0.0 ──────────────────────────────────
  // POST /recurring/swap body is ONLY { uuid, appId } — the server reads
  // schedule params and minAmountOut from the cached quote.
  const tx = await getRecurringSwapService().recurringSwap({
    uuid: quote.uuid,
    appId: quote.appId
  })

  // ── Step 4: dispatch the first-fill tx ───────────────────────────────────
  await request({
    method: RpcMethod.ETH_SEND_TRANSACTION,
    params: [
      {
        from: tx.from,
        to: tx.to,
        data: tx.data,
        value: tx.value
      }
    ],
    chainId: caip2ChainId,
    context: {
      [RequestContext.RECURRING_SWAP]: {
        ...baseContext,
        step: 'fill' as const
      }
    }
  })
}
