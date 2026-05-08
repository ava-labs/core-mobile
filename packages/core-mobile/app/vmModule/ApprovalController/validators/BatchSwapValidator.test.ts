import {
  AlertType,
  type BatchApprovalParams,
  type RpcRequest
} from '@avalabs/vm-module-types'
import { WalletType } from 'services/wallet/types'
import {
  CORE_MOBILE_TOPIC,
  RequestContext,
  RpcMethod,
  type SwapAutoApproveContext
} from 'store/rpc/types'
import type { BalanceChangeData } from 'features/swap/utils/swapValidation'

const mockAnalyticsCapture = jest.fn()

jest.mock('services/analytics/AnalyticsService', () => ({
  __esModule: true,
  default: {
    capture: (...args: unknown[]) => mockAnalyticsCapture(...args)
  }
}))

import { batchSwapValidator } from './BatchSwapValidator'

const SRC_TOKEN = '0xAAA0000000000000000000000000000000000001'
const DST_TOKEN = '0xBBB0000000000000000000000000000000000002'

const baseContext: SwapAutoApproveContext = {
  autoApprove: true,
  maxBuy: 'unlimited',
  srcTokenAddress: SRC_TOKEN,
  destTokenAddress: DST_TOKEN,
  isSrcTokenNative: false,
  isDestTokenNative: false,
  slippage: 50,
  minAmountOut: '90',
  isSwapFeesEnabled: false
}

const makeBatchRequest = (overrides: Partial<RpcRequest> = {}): RpcRequest =>
  ({
    requestId: 'req-1',
    sessionId: CORE_MOBILE_TOPIC,
    method: RpcMethod.ETH_SEND_TRANSACTION_BATCH,
    chainId: 'eip155:43114',
    dappInfo: { name: 'Core', url: '', icon: '' },
    context: {
      [RequestContext.SWAP_AUTO_APPROVE]: baseContext,
      walletType: WalletType.MNEMONIC
    },
    ...overrides
  } as unknown as RpcRequest)

const sourceOutBalanceChange = (
  overrides: { sourceUsd?: string; destUsd?: string } = {}
): BalanceChangeData => ({
  outs: [
    {
      token: {
        address: SRC_TOKEN,
        decimals: 0,
        symbol: 'SRC'
      },
      items: [
        {
          displayValue: '100',
          usdPrice: overrides.sourceUsd ?? '100',
          rawValue: '100'
        }
      ]
    }
  ],
  ins: [
    {
      token: {
        address: DST_TOKEN,
        decimals: 0,
        symbol: 'DST'
      },
      items: [
        {
          displayValue: '100',
          usdPrice: overrides.destUsd ?? '100',
          rawValue: '100'
        }
      ]
    }
  ]
})

const makeParams = (
  overrides: {
    request?: RpcRequest
    balanceChange?: BalanceChangeData
    isSimulationSuccessful?: boolean
    alertType?: AlertType
    alertTitle?: string
  } = {}
): BatchApprovalParams => ({
  request: overrides.request ?? makeBatchRequest(),
  signingRequests: [],
  displayData: {
    title: 'Quick Swaps',
    details: [],
    balanceChange: (overrides.balanceChange ??
      sourceOutBalanceChange()) as never,
    isSimulationSuccessful: overrides.isSimulationSuccessful ?? true,
    ...(overrides.alertType
      ? {
          alert: {
            type: overrides.alertType,
            details: {
              title: overrides.alertTitle ?? 'Test alert',
              description: 'Test alert description'
            }
          }
        }
      : {})
  },
  updateTx: jest.fn() as never
})

describe('BatchSwapValidator.canHandle', () => {
  it('matches an in-app batch request with autoApprove and software wallet', () => {
    expect(batchSwapValidator.canHandle(makeBatchRequest())).toBe(true)
  })

  it('rejects requests not from in-app code (e.g. external dApp)', () => {
    const dappRequest = makeBatchRequest({ sessionId: 'wc-topic-external' })
    expect(batchSwapValidator.canHandle(dappRequest)).toBe(false)
  })

  it('rejects requests using a different RPC method', () => {
    const sendRequest = makeBatchRequest({
      method: 'eth_sendTransaction' as unknown as RpcRequest['method']
    })
    expect(batchSwapValidator.canHandle(sendRequest)).toBe(false)
  })

  it('rejects when swapAutoApprove is missing from context', () => {
    const noCtx = makeBatchRequest({
      context: {
        walletType: WalletType.MNEMONIC
      } as never
    })
    expect(batchSwapValidator.canHandle(noCtx)).toBe(false)
  })

  it('rejects when swapAutoApprove.autoApprove is false', () => {
    const noAuto = makeBatchRequest({
      context: {
        [RequestContext.SWAP_AUTO_APPROVE]: {
          ...baseContext,
          autoApprove: false
        },
        walletType: WalletType.MNEMONIC
      } as never
    })
    expect(batchSwapValidator.canHandle(noAuto)).toBe(false)
  })

  it.each([WalletType.LEDGER, WalletType.LEDGER_LIVE, WalletType.KEYSTONE])(
    'rejects %s wallets defensively',
    walletType => {
      const hwRequest = makeBatchRequest({
        context: {
          [RequestContext.SWAP_AUTO_APPROVE]: baseContext,
          walletType
        } as never
      })
      expect(batchSwapValidator.canHandle(hwRequest)).toBe(false)
    }
  )

  it.each([WalletType.MNEMONIC, WalletType.SEEDLESS, WalletType.PRIVATE_KEY])(
    'matches %s wallets when other conditions hold',
    walletType => {
      const swRequest = makeBatchRequest({
        context: {
          [RequestContext.SWAP_AUTO_APPROVE]: baseContext,
          walletType
        } as never
      })
      expect(batchSwapValidator.canHandle(swRequest)).toBe(true)
    }
  )

  it('rejects when walletType is missing from context (allowlist fails closed)', () => {
    const noWallet = makeBatchRequest({
      context: {
        [RequestContext.SWAP_AUTO_APPROVE]: baseContext
      } as never
    })
    expect(batchSwapValidator.canHandle(noWallet)).toBe(false)
  })
})

describe('BatchSwapValidator.validate', () => {
  beforeEach(() => {
    mockAnalyticsCapture.mockReset()
  })

  it('returns isValid:true when no alert and amounts match the quote', async () => {
    const result = await batchSwapValidator.validate(makeParams())
    expect(result.isValid).toBe(true)
  })

  it('hard-rejects when displayData.alert is Danger (Blockaid Malicious)', async () => {
    const result = await batchSwapValidator.validate(
      makeParams({ alertType: AlertType.DANGER })
    )
    expect(result.isValid).toBe(false)
    if (!result.isValid) {
      expect(result.requiresManualApproval).toBe(false)
      expect(result.code).toBe('tx_flagged_malicious')
    }
  })

  it('falls back to manual when displayData.alert is Warning', async () => {
    const result = await batchSwapValidator.validate(
      makeParams({ alertType: AlertType.WARNING })
    )
    expect(result.isValid).toBe(false)
    if (!result.isValid) {
      expect(result.requiresManualApproval).toBe(true)
      expect(result.code).toBe('tx_flagged_warning')
    }
  })

  it('continues to amount checks when displayData.alert is Info (non-blocking)', async () => {
    const result = await batchSwapValidator.validate(
      makeParams({ alertType: AlertType.INFO })
    )
    expect(result.isValid).toBe(true)
  })

  it('hard-rejects when isSimulationSuccessful is explicitly false', async () => {
    const result = await batchSwapValidator.validate(
      makeParams({ isSimulationSuccessful: false })
    )
    expect(result.isValid).toBe(false)
    if (!result.isValid) {
      expect(result.code).toBe('simulation_failed')
      expect(result.requiresManualApproval).toBe(false)
    }
  })

  it('treats undefined isSimulationSuccessful as continue (does not hard-reject)', async () => {
    const params = makeParams()
    delete params.displayData.isSimulationSuccessful
    const result = await batchSwapValidator.validate(params)
    expect(result.isValid).toBe(true)
  })

  it('falls back to manual when balanceChange is absent', async () => {
    const params = makeParams()
    delete params.displayData.balanceChange
    const result = await batchSwapValidator.validate(params)
    expect(result.isValid).toBe(false)
    if (!result.isValid) {
      expect(result.requiresManualApproval).toBe(true)
      expect(result.code).toBe('balance_change_missing')
    }
  })

  it('falls back to manual when amount exceeds maxBuy limit', async () => {
    const result = await batchSwapValidator.validate(
      makeParams({
        request: makeBatchRequest({
          context: {
            [RequestContext.SWAP_AUTO_APPROVE]: {
              ...baseContext,
              maxBuy: '5000'
            },
            walletType: WalletType.MNEMONIC
          } as never
        }),
        balanceChange: sourceOutBalanceChange({
          sourceUsd: '6000',
          destUsd: '6000'
        })
      })
    )
    expect(result.isValid).toBe(false)
    if (!result.isValid) {
      expect(result.code).toBe('amount_over_limit')
      expect(result.requiresManualApproval).toBe(true)
    }
  })

  it('falls back to manual when context.swapAutoApprove is missing', async () => {
    const result = await batchSwapValidator.validate(
      makeParams({ request: makeBatchRequest({ context: {} as never }) })
    )
    expect(result.isValid).toBe(false)
    if (!result.isValid) {
      expect(result.requiresManualApproval).toBe(true)
      expect(result.code).toBe('context_missing')
    }
  })
})

describe('BatchSwapValidator.validate telemetry', () => {
  beforeEach(() => {
    mockAnalyticsCapture.mockReset()
  })

  it('emits QuickSwapsBypassFired on the auto-approve path', async () => {
    await batchSwapValidator.validate(makeParams())
    expect(mockAnalyticsCapture).toHaveBeenCalledWith('QuickSwapsBypassFired', {
      caip2SourceChainId: 'eip155:43114',
      maxBuy: 'unlimited'
    })
  })

  it('emits `tx_flagged_malicious` and requiresManualApproval:false on hard reject', async () => {
    await batchSwapValidator.validate(
      makeParams({ alertType: AlertType.DANGER })
    )
    expect(mockAnalyticsCapture).toHaveBeenCalledWith(
      'QuickSwapsBypassFellBack',
      expect.objectContaining({
        reason: 'tx_flagged_malicious',
        requiresManualApproval: false
      })
    )
  })

  it('emits `tx_flagged_warning` for Blockaid Warning verdict', async () => {
    await batchSwapValidator.validate(
      makeParams({ alertType: AlertType.WARNING })
    )
    expect(mockAnalyticsCapture).toHaveBeenCalledWith(
      'QuickSwapsBypassFellBack',
      expect.objectContaining({
        reason: 'tx_flagged_warning',
        requiresManualApproval: true
      })
    )
  })

  it('forwards validateSwapAmounts code (e.g. amount_over_limit) into telemetry', async () => {
    await batchSwapValidator.validate(
      makeParams({
        request: makeBatchRequest({
          context: {
            [RequestContext.SWAP_AUTO_APPROVE]: {
              ...baseContext,
              maxBuy: '5000'
            },
            walletType: WalletType.MNEMONIC
          } as never
        }),
        balanceChange: sourceOutBalanceChange({
          sourceUsd: '6000',
          destUsd: '6000'
        })
      })
    )
    expect(mockAnalyticsCapture).toHaveBeenCalledWith(
      'QuickSwapsBypassFellBack',
      expect.objectContaining({ reason: 'amount_over_limit' })
    )
  })

  it('emits `context_missing` when swapAutoApprove is absent', async () => {
    await batchSwapValidator.validate(
      makeParams({ request: makeBatchRequest({ context: {} as never }) })
    )
    expect(mockAnalyticsCapture).toHaveBeenCalledWith(
      'QuickSwapsBypassFellBack',
      expect.objectContaining({ reason: 'context_missing' })
    )
  })

  it('emits exactly ONE event per validate() call', async () => {
    await batchSwapValidator.validate(makeParams())
    expect(mockAnalyticsCapture).toHaveBeenCalledTimes(1)
  })
})
