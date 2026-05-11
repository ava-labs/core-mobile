import {
  AlertType,
  type ApprovalParams,
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

import { swapValidator } from './SwapValidator'

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

const makeRequest = (overrides: Partial<RpcRequest> = {}): RpcRequest =>
  ({
    requestId: 'req-1',
    sessionId: CORE_MOBILE_TOPIC,
    method: RpcMethod.ETH_SEND_TRANSACTION,
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
      token: { address: SRC_TOKEN, decimals: 0, symbol: 'SRC' },
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
      token: { address: DST_TOKEN, decimals: 0, symbol: 'DST' },
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
    signingDataType?: string
    balanceChange?: BalanceChangeData
    isSimulationSuccessful?: boolean
    alertType?: AlertType
    alertTitle?: string
  } = {}
): ApprovalParams =>
  ({
    request: overrides.request ?? makeRequest(),
    signingData: {
      type: overrides.signingDataType ?? RpcMethod.ETH_SEND_TRANSACTION,
      account: '0x123',
      data: { from: '0x123', to: '0xrouter', data: '0x' }
    },
    displayData: {
      title: 'Quick Swap',
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
    }
  } as unknown as ApprovalParams)

describe('swapValidator.canHandle', () => {
  it('matches an in-app eth_sendTransaction with autoApprove and software wallet', () => {
    expect(swapValidator.canHandle(makeParams())).toBe(true)
  })

  it('rejects requests not from in-app code (e.g. external dApp)', () => {
    expect(
      swapValidator.canHandle(
        makeParams({
          request: makeRequest({ sessionId: 'wc-topic-external' })
        })
      )
    ).toBe(false)
  })

  it('rejects when signingData.type is not eth_sendTransaction (e.g. personal_sign)', () => {
    expect(
      swapValidator.canHandle(
        makeParams({ signingDataType: RpcMethod.PERSONAL_SIGN as string })
      )
    ).toBe(false)
  })

  it('rejects when swapAutoApprove is missing from context', () => {
    expect(
      swapValidator.canHandle(
        makeParams({
          request: makeRequest({
            context: { walletType: WalletType.MNEMONIC } as never
          })
        })
      )
    ).toBe(false)
  })

  it('rejects when swapAutoApprove.autoApprove is false', () => {
    expect(
      swapValidator.canHandle(
        makeParams({
          request: makeRequest({
            context: {
              [RequestContext.SWAP_AUTO_APPROVE]: {
                ...baseContext,
                autoApprove: false
              },
              walletType: WalletType.MNEMONIC
            } as never
          })
        })
      )
    ).toBe(false)
  })

  it.each([WalletType.LEDGER, WalletType.LEDGER_LIVE, WalletType.KEYSTONE])(
    'rejects %s wallets defensively',
    walletType => {
      expect(
        swapValidator.canHandle(
          makeParams({
            request: makeRequest({
              context: {
                [RequestContext.SWAP_AUTO_APPROVE]: baseContext,
                walletType
              } as never
            })
          })
        )
      ).toBe(false)
    }
  )

  it.each([WalletType.MNEMONIC, WalletType.SEEDLESS, WalletType.PRIVATE_KEY])(
    'matches %s wallets when other conditions hold',
    walletType => {
      expect(
        swapValidator.canHandle(
          makeParams({
            request: makeRequest({
              context: {
                [RequestContext.SWAP_AUTO_APPROVE]: baseContext,
                walletType
              } as never
            })
          })
        )
      ).toBe(true)
    }
  )

  it('rejects when walletType is missing from context (allowlist fails closed)', () => {
    expect(
      swapValidator.canHandle(
        makeParams({
          request: makeRequest({
            context: {
              [RequestContext.SWAP_AUTO_APPROVE]: baseContext
            } as never
          })
        })
      )
    ).toBe(false)
  })
})

describe('swapValidator.validate', () => {
  beforeEach(() => {
    mockAnalyticsCapture.mockReset()
  })

  it('returns isValid:true when no alert and amounts match the quote', async () => {
    const result = await swapValidator.validate(makeParams())
    expect(result.isValid).toBe(true)
  })

  it('falls back to manual when displayData.alert is Danger (Blockaid Malicious)', async () => {
    // Matches core-extension: Danger surfaces the alert in the manual
    // modal rather than hard-rejecting. The user sees Blockaid's "Scam
    // transaction" banner and explicit Proceed/Reject buttons.
    const result = await swapValidator.validate(
      makeParams({ alertType: AlertType.DANGER })
    )
    expect(result.isValid).toBe(false)
    if (!result.isValid) {
      expect(result.requiresManualApproval).toBe(true)
      expect(result.code).toBe('tx_flagged_malicious')
    }
  })

  it('falls back to manual when displayData.alert is Warning', async () => {
    const result = await swapValidator.validate(
      makeParams({ alertType: AlertType.WARNING })
    )
    expect(result.isValid).toBe(false)
    if (!result.isValid) {
      expect(result.requiresManualApproval).toBe(true)
      expect(result.code).toBe('tx_flagged_warning')
    }
  })

  it('continues to amount checks when displayData.alert is Info (non-blocking)', async () => {
    const result = await swapValidator.validate(
      makeParams({ alertType: AlertType.INFO })
    )
    expect(result.isValid).toBe(true)
  })

  it('hard-rejects when isSimulationSuccessful is explicitly false', async () => {
    const result = await swapValidator.validate(
      makeParams({ isSimulationSuccessful: false })
    )
    expect(result.isValid).toBe(false)
    if (!result.isValid) {
      expect(result.code).toBe('simulation_failed')
      expect(result.requiresManualApproval).toBe(false)
    }
  })

  it('falls back to manual when balanceChange is absent', async () => {
    const params = makeParams()
    delete (params.displayData as { balanceChange?: unknown }).balanceChange
    const result = await swapValidator.validate(params)
    expect(result.isValid).toBe(false)
    if (!result.isValid) {
      expect(result.requiresManualApproval).toBe(true)
      expect(result.code).toBe('balance_change_missing')
    }
  })

  it('falls back to manual when amount exceeds maxBuy limit', async () => {
    const result = await swapValidator.validate(
      makeParams({
        request: makeRequest({
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
    const result = await swapValidator.validate(
      makeParams({ request: makeRequest({ context: {} as never }) })
    )
    expect(result.isValid).toBe(false)
    if (!result.isValid) {
      expect(result.requiresManualApproval).toBe(true)
      expect(result.code).toBe('context_missing')
    }
  })
})

describe('swapValidator.validate telemetry', () => {
  beforeEach(() => {
    mockAnalyticsCapture.mockReset()
  })

  it('emits QuickSwapsBypassFired on the auto-approve path', async () => {
    await swapValidator.validate(makeParams())
    expect(mockAnalyticsCapture).toHaveBeenCalledWith('QuickSwapsBypassFired', {
      caip2SourceChainId: 'eip155:43114',
      maxBuy: 'unlimited'
    })
  })

  it('emits `tx_flagged_malicious` and requiresManualApproval:true on Danger fallback', async () => {
    await swapValidator.validate(makeParams({ alertType: AlertType.DANGER }))
    expect(mockAnalyticsCapture).toHaveBeenCalledWith(
      'QuickSwapsBypassFellBack',
      expect.objectContaining({
        reason: 'tx_flagged_malicious',
        requiresManualApproval: true
      })
    )
  })

  it('emits `tx_flagged_warning` for Blockaid Warning verdict', async () => {
    await swapValidator.validate(makeParams({ alertType: AlertType.WARNING }))
    expect(mockAnalyticsCapture).toHaveBeenCalledWith(
      'QuickSwapsBypassFellBack',
      expect.objectContaining({
        reason: 'tx_flagged_warning',
        requiresManualApproval: true
      })
    )
  })

  it('forwards validateSwapAmounts code (e.g. amount_over_limit) into telemetry', async () => {
    await swapValidator.validate(
      makeParams({
        request: makeRequest({
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
    await swapValidator.validate(
      makeParams({ request: makeRequest({ context: {} as never }) })
    )
    expect(mockAnalyticsCapture).toHaveBeenCalledWith(
      'QuickSwapsBypassFellBack',
      expect.objectContaining({ reason: 'context_missing' })
    )
  })

  it('emits exactly ONE event per validate() call', async () => {
    await swapValidator.validate(makeParams())
    expect(mockAnalyticsCapture).toHaveBeenCalledTimes(1)
  })
})
