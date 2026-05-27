import { AlertType, type RpcRequest } from '@avalabs/vm-module-types'
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

import Logger from 'utils/Logger'
import {
  isBypassEligible,
  readRecurringSwapApprovalContext,
  recurringSwapApprovalContextSchema,
  runValidateAndCapture
} from './shared'

const SRC_TOKEN = '0xAAA0000000000000000000000000000000000001'
const DST_TOKEN = '0xBBB0000000000000000000000000000000000002'

const baseContext: SwapAutoApproveContext = {
  maxBuy: 'unlimited',
  srcTokenAddress: SRC_TOKEN,
  destTokenAddress: DST_TOKEN,
  isSrcTokenNative: false,
  isDestTokenNative: false,
  slippage: 50,
  minAmountOut: '90'
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
      [RequestContext.QUICK_SWAPS_AVAILABLE]: true,
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

type DisplayDataOverrides = {
  balanceChange?: BalanceChangeData
  isSimulationSuccessful?: boolean
  alertType?: AlertType
  alertTitle?: string
}

const makeDisplayData = (overrides: DisplayDataOverrides = {}): never =>
  ({
    title: 'Quick Swap',
    details: [],
    balanceChange: overrides.balanceChange ?? sourceOutBalanceChange(),
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
  } as unknown as never)

const runShared = (overrides: {
  request?: RpcRequest
  displayData?: DisplayDataOverrides
}) =>
  runValidateAndCapture({
    request: overrides.request ?? makeRequest(),
    displayData: makeDisplayData(overrides.displayData),
    loggerTag: '[shared.test]'
  })

describe('shared.isBypassEligible', () => {
  it('returns true for in-app + SWAP_AUTO_APPROVE + software wallet', () => {
    expect(isBypassEligible(makeRequest())).toBe(true)
  })

  it('returns false for external (non-CORE_MOBILE_TOPIC) requests', () => {
    expect(
      isBypassEligible(makeRequest({ sessionId: 'wc-topic-external' }))
    ).toBe(false)
  })

  it('returns false when SWAP_AUTO_APPROVE is missing from context', () => {
    expect(
      isBypassEligible(
        makeRequest({
          context: { walletType: WalletType.MNEMONIC } as never
        })
      )
    ).toBe(false)
  })

  it.each([WalletType.LEDGER, WalletType.LEDGER_LIVE, WalletType.KEYSTONE])(
    'returns false for %s wallets defensively',
    walletType => {
      expect(
        isBypassEligible(
          makeRequest({
            context: {
              [RequestContext.SWAP_AUTO_APPROVE]: baseContext,
              [RequestContext.QUICK_SWAPS_AVAILABLE]: true,
              walletType
            } as never
          })
        )
      ).toBe(false)
    }
  )

  it('returns false when walletType is missing (allowlist fails closed)', () => {
    expect(
      isBypassEligible(
        makeRequest({
          context: {
            [RequestContext.SWAP_AUTO_APPROVE]: baseContext,
            [RequestContext.QUICK_SWAPS_AVAILABLE]: true
          } as never
        })
      )
    ).toBe(false)
  })

  it('returns false when QUICK_SWAPS_AVAILABLE is false (kill switch)', () => {
    expect(
      isBypassEligible(
        makeRequest({
          context: {
            [RequestContext.SWAP_AUTO_APPROVE]: baseContext,
            [RequestContext.QUICK_SWAPS_AVAILABLE]: false,
            walletType: WalletType.MNEMONIC
          } as never
        })
      )
    ).toBe(false)
  })

  it('returns false when QUICK_SWAPS_AVAILABLE is absent (defense-in-depth)', () => {
    expect(
      isBypassEligible(
        makeRequest({
          context: {
            [RequestContext.SWAP_AUTO_APPROVE]: baseContext,
            walletType: WalletType.MNEMONIC
          } as never
        })
      )
    ).toBe(false)
  })

  it('returns false when context shape is invalid (Zod rejects)', () => {
    expect(
      isBypassEligible(
        makeRequest({
          context: {
            [RequestContext.SWAP_AUTO_APPROVE]: {
              slippage: 'not-a-number' // wrong type
            },
            [RequestContext.QUICK_SWAPS_AVAILABLE]: true,
            walletType: WalletType.MNEMONIC
          } as never
        })
      )
    ).toBe(false)
  })
})

describe('shared.runValidateAndCapture', () => {
  beforeEach(() => {
    mockAnalyticsCapture.mockReset()
  })

  it('returns isValid:true when no alert and amounts match the quote', async () => {
    const result = await runShared({})
    expect(result.isValid).toBe(true)
  })

  it('falls back to manual when displayData.alert is Danger (Blockaid Malicious)', async () => {
    // Matches core-extension: Danger surfaces the alert in the manual
    // modal rather than hard-rejecting. The user sees Blockaid's "Scam
    // transaction" banner and explicit Proceed/Reject buttons.
    const result = await runShared({
      displayData: { alertType: AlertType.DANGER }
    })
    expect(result.isValid).toBe(false)
    if (!result.isValid) {
      expect(result.requiresManualApproval).toBe(true)
      expect(result.code).toBe('tx_flagged_malicious')
    }
  })

  it('falls back to manual when displayData.alert is Warning', async () => {
    const result = await runShared({
      displayData: { alertType: AlertType.WARNING }
    })
    expect(result.isValid).toBe(false)
    if (!result.isValid) {
      expect(result.requiresManualApproval).toBe(true)
      expect(result.code).toBe('tx_flagged_warning')
    }
  })

  it('continues to amount checks when displayData.alert is Info (non-blocking)', async () => {
    const result = await runShared({
      displayData: { alertType: AlertType.INFO }
    })
    expect(result.isValid).toBe(true)
  })

  it('hard-rejects when isSimulationSuccessful is explicitly false', async () => {
    const result = await runShared({
      displayData: { isSimulationSuccessful: false }
    })
    expect(result.isValid).toBe(false)
    if (!result.isValid) {
      expect(result.code).toBe('simulation_failed')
      expect(result.requiresManualApproval).toBe(false)
    }
  })

  it('treats undefined isSimulationSuccessful as continue (does not hard-reject)', async () => {
    const result = await runValidateAndCapture({
      request: makeRequest(),
      displayData: {
        title: 'Quick Swap',
        details: [],
        balanceChange: sourceOutBalanceChange()
        // isSimulationSuccessful intentionally omitted
      } as never,
      loggerTag: '[shared.test]'
    })
    expect(result.isValid).toBe(true)
  })

  it('falls back to manual when balanceChange is absent', async () => {
    const result = await runValidateAndCapture({
      request: makeRequest(),
      displayData: {
        title: 'Quick Swap',
        details: [],
        isSimulationSuccessful: true
        // balanceChange intentionally omitted
      } as never,
      loggerTag: '[shared.test]'
    })
    expect(result.isValid).toBe(false)
    if (!result.isValid) {
      expect(result.requiresManualApproval).toBe(true)
      expect(result.code).toBe('balance_change_missing')
    }
  })

  it('falls back to manual when amount exceeds maxBuy limit', async () => {
    const result = await runShared({
      request: makeRequest({
        context: {
          [RequestContext.SWAP_AUTO_APPROVE]: {
            ...baseContext,
            maxBuy: '5000'
          },
          walletType: WalletType.MNEMONIC
        } as never
      }),
      displayData: {
        balanceChange: sourceOutBalanceChange({
          sourceUsd: '6000',
          destUsd: '6000'
        })
      }
    })
    expect(result.isValid).toBe(false)
    if (!result.isValid) {
      expect(result.code).toBe('amount_over_limit')
      expect(result.requiresManualApproval).toBe(true)
    }
  })

  it('falls back to manual when context.swapAutoApprove is missing', async () => {
    const result = await runShared({
      request: makeRequest({ context: {} as never })
    })
    expect(result.isValid).toBe(false)
    if (!result.isValid) {
      expect(result.requiresManualApproval).toBe(true)
      expect(result.code).toBe('context_missing')
    }
  })
})

describe('shared.runValidateAndCapture telemetry', () => {
  beforeEach(() => {
    mockAnalyticsCapture.mockReset()
  })

  it('emits QuickSwapsBypassFired on the auto-approve path', async () => {
    await runShared({})
    expect(mockAnalyticsCapture).toHaveBeenCalledWith('QuickSwapsBypassFired', {
      caip2SourceChainId: 'eip155:43114',
      maxBuy: 'unlimited'
    })
  })

  it('emits `tx_flagged_malicious` and requiresManualApproval:true on Danger fallback', async () => {
    await runShared({ displayData: { alertType: AlertType.DANGER } })
    expect(mockAnalyticsCapture).toHaveBeenCalledWith(
      'QuickSwapsBypassFellBack',
      expect.objectContaining({
        reason: 'tx_flagged_malicious',
        requiresManualApproval: true
      })
    )
  })

  it('emits `tx_flagged_warning` for Blockaid Warning verdict', async () => {
    await runShared({ displayData: { alertType: AlertType.WARNING } })
    expect(mockAnalyticsCapture).toHaveBeenCalledWith(
      'QuickSwapsBypassFellBack',
      expect.objectContaining({
        reason: 'tx_flagged_warning',
        requiresManualApproval: true
      })
    )
  })

  it('forwards validateSwapAmounts code (e.g. amount_over_limit) into telemetry', async () => {
    await runShared({
      request: makeRequest({
        context: {
          [RequestContext.SWAP_AUTO_APPROVE]: {
            ...baseContext,
            maxBuy: '5000'
          },
          walletType: WalletType.MNEMONIC
        } as never
      }),
      displayData: {
        balanceChange: sourceOutBalanceChange({
          sourceUsd: '6000',
          destUsd: '6000'
        })
      }
    })
    expect(mockAnalyticsCapture).toHaveBeenCalledWith(
      'QuickSwapsBypassFellBack',
      expect.objectContaining({ reason: 'amount_over_limit' })
    )
  })

  it('emits `context_missing` when swapAutoApprove is absent', async () => {
    await runShared({ request: makeRequest({ context: {} as never }) })
    expect(mockAnalyticsCapture).toHaveBeenCalledWith(
      'QuickSwapsBypassFellBack',
      expect.objectContaining({ reason: 'context_missing' })
    )
  })

  it('emits exactly ONE event per validate() call', async () => {
    await runShared({})
    expect(mockAnalyticsCapture).toHaveBeenCalledTimes(1)
  })
})

describe('recurringSwapApprovalContextSchema', () => {
  const valid = {
    step: 'fill' as const,
    quoteUuid: '6674c5b1-a014-420f-9e5e-f3c4a863061f',
    fromTokenAddress: '0x' + 'a'.repeat(40),
    fromTokenSymbol: 'LINK',
    fromTokenDecimals: 18,
    toTokenAddress: '0x' + 'b'.repeat(40),
    toTokenSymbol: 'AVAX',
    toTokenDecimals: 18,
    amountPerOrder: '15000000000000000000',
    totalAmountIn: '60000000000000000000',
    numberOfOrders: 4,
    isUnlimited: false,
    frequency: { unit: 'week', value: 4 },
    intervalSeconds: 2419200,
    chainId: 43114
  }

  it('accepts a valid recurring approval context', () => {
    expect(recurringSwapApprovalContextSchema.safeParse(valid).success).toBe(
      true
    )
  })

  it('rejects numberOfOrders below 2', () => {
    expect(
      recurringSwapApprovalContextSchema.safeParse({
        ...valid,
        numberOfOrders: 1
      }).success
    ).toBe(false)
  })

  it('rejects numberOfOrders above 365', () => {
    expect(
      recurringSwapApprovalContextSchema.safeParse({
        ...valid,
        numberOfOrders: 366
      }).success
    ).toBe(false)
  })

  it('rejects intervalSeconds below 60', () => {
    expect(
      recurringSwapApprovalContextSchema.safeParse({
        ...valid,
        intervalSeconds: 59
      }).success
    ).toBe(false)
  })

  it('rejects unknown frequency unit', () => {
    expect(
      recurringSwapApprovalContextSchema.safeParse({
        ...valid,
        frequency: { unit: 'year', value: 1 }
      }).success
    ).toBe(false)
  })

  it('accepts step: "approve"', () => {
    expect(
      recurringSwapApprovalContextSchema.safeParse({
        ...valid,
        step: 'approve'
      }).success
    ).toBe(true)
  })

  it('rejects unknown keys (.strict)', () => {
    expect(
      recurringSwapApprovalContextSchema.safeParse({
        ...valid,
        unexpectedField: 'foo'
      }).success
    ).toBe(false)
  })

  it('rejects invalid step enum value', () => {
    expect(
      recurringSwapApprovalContextSchema.safeParse({
        ...valid,
        step: 'cancel'
      }).success
    ).toBe(false)
  })

  it('rejects non-UUID quoteUuid', () => {
    expect(
      recurringSwapApprovalContextSchema.safeParse({
        ...valid,
        quoteUuid: 'not-a-uuid'
      }).success
    ).toBe(false)
  })

  it('rejects fromTokenAddress with wrong hex length', () => {
    expect(
      recurringSwapApprovalContextSchema.safeParse({
        ...valid,
        fromTokenAddress: '0xabc'
      }).success
    ).toBe(false)
  })

  it('rejects fromTokenAddress with non-hex characters', () => {
    expect(
      recurringSwapApprovalContextSchema.safeParse({
        ...valid,
        fromTokenAddress: '0x' + 'z'.repeat(40)
      }).success
    ).toBe(false)
  })

  it('rejects empty fromTokenSymbol', () => {
    expect(
      recurringSwapApprovalContextSchema.safeParse({
        ...valid,
        fromTokenSymbol: ''
      }).success
    ).toBe(false)
  })

  it('rejects negative fromTokenDecimals', () => {
    expect(
      recurringSwapApprovalContextSchema.safeParse({
        ...valid,
        fromTokenDecimals: -1
      }).success
    ).toBe(false)
  })

  it('rejects fromTokenDecimals above 18', () => {
    expect(
      recurringSwapApprovalContextSchema.safeParse({
        ...valid,
        fromTokenDecimals: 19
      }).success
    ).toBe(false)
  })

  it('rejects non-integer fromTokenDecimals', () => {
    expect(
      recurringSwapApprovalContextSchema.safeParse({
        ...valid,
        fromTokenDecimals: 6.5
      }).success
    ).toBe(false)
  })

  it('rejects amountPerOrder with decimal point', () => {
    expect(
      recurringSwapApprovalContextSchema.safeParse({
        ...valid,
        amountPerOrder: '15.5'
      }).success
    ).toBe(false)
  })

  it('rejects negative amountPerOrder string', () => {
    expect(
      recurringSwapApprovalContextSchema.safeParse({
        ...valid,
        amountPerOrder: '-1'
      }).success
    ).toBe(false)
  })

  it('rejects non-numeric totalAmountIn (e.g. hex literal)', () => {
    expect(
      recurringSwapApprovalContextSchema.safeParse({
        ...valid,
        totalAmountIn: '0xff'
      }).success
    ).toBe(false)
  })

  it('rejects frequency.value of zero', () => {
    expect(
      recurringSwapApprovalContextSchema.safeParse({
        ...valid,
        frequency: { unit: 'day', value: 0 }
      }).success
    ).toBe(false)
  })

  it('rejects chainId of zero', () => {
    expect(
      recurringSwapApprovalContextSchema.safeParse({
        ...valid,
        chainId: 0
      }).success
    ).toBe(false)
  })

  it('rejects negative chainId', () => {
    expect(
      recurringSwapApprovalContextSchema.safeParse({
        ...valid,
        chainId: -1
      }).success
    ).toBe(false)
  })
})

describe('readRecurringSwapApprovalContext', () => {
  const valid = {
    step: 'fill' as const,
    quoteUuid: '6674c5b1-a014-420f-9e5e-f3c4a863061f',
    fromTokenAddress: '0x' + 'a'.repeat(40),
    fromTokenSymbol: 'LINK',
    fromTokenDecimals: 18,
    toTokenAddress: '0x' + 'b'.repeat(40),
    toTokenSymbol: 'AVAX',
    toTokenDecimals: 18,
    amountPerOrder: '15000000000000000000',
    totalAmountIn: '60000000000000000000',
    numberOfOrders: 4,
    isUnlimited: false,
    frequency: { unit: 'week' as const, value: 4 },
    intervalSeconds: 2419200,
    chainId: 43114
  }

  it('returns undefined when RECURRING_SWAP context is absent', () => {
    const request = {
      context: { walletType: WalletType.MNEMONIC }
    } as unknown as RpcRequest
    expect(readRecurringSwapApprovalContext(request)).toBeUndefined()
  })

  it('returns undefined and logs an error when context is malformed', () => {
    const loggerSpy = jest.spyOn(Logger, 'error').mockImplementation(() => {
      /* swallow in test */
    })
    const request = {
      context: {
        [RequestContext.RECURRING_SWAP]: {
          step: 'fill',
          numberOfOrders: 1 // below min, and other required fields missing
        }
      }
    } as unknown as RpcRequest
    expect(readRecurringSwapApprovalContext(request)).toBeUndefined()
    expect(loggerSpy).toHaveBeenCalled()
    loggerSpy.mockRestore()
  })

  it('returns the parsed typed object when context is valid', () => {
    const request = {
      context: {
        [RequestContext.RECURRING_SWAP]: valid
      }
    } as unknown as RpcRequest
    expect(readRecurringSwapApprovalContext(request)).toEqual(valid)
  })
})
