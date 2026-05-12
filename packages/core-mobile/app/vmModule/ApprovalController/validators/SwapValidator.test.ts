import { type ApprovalParams, type RpcRequest } from '@avalabs/vm-module-types'
import { WalletType } from 'services/wallet/types'
import {
  CORE_MOBILE_TOPIC,
  RequestContext,
  RpcMethod,
  type SwapAutoApproveContext
} from 'store/rpc/types'
import type { BalanceChangeData } from 'features/swap/utils/swapValidation'

jest.mock('services/analytics/AnalyticsService', () => ({
  __esModule: true,
  default: { capture: jest.fn() }
}))

import { swapValidator } from './SwapValidator'

// Behavioural cases for validate()/telemetry live in shared.test.ts —
// this file covers only canHandle (which is what's specific to the
// single-tx validator) plus a one-shot smoke test that proves
// validate() delegates to the shared module.

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

const balanceChange: BalanceChangeData = {
  outs: [
    {
      token: { address: SRC_TOKEN, decimals: 0, symbol: 'SRC' },
      items: [{ displayValue: '100', usdPrice: '100', rawValue: '100' }]
    }
  ],
  ins: [
    {
      token: { address: DST_TOKEN, decimals: 0, symbol: 'DST' },
      items: [{ displayValue: '100', usdPrice: '100', rawValue: '100' }]
    }
  ]
}

const makeParams = (
  overrides: {
    request?: RpcRequest
    signingDataType?: string
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
      balanceChange: balanceChange as never,
      isSimulationSuccessful: true
    }
  } as unknown as ApprovalParams)

describe('swapValidator.canHandle', () => {
  it('matches an in-app eth_sendTransaction with SWAP_AUTO_APPROVE context and software wallet', () => {
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

  it.each([WalletType.LEDGER, WalletType.LEDGER_LIVE, WalletType.KEYSTONE])(
    'rejects %s wallets defensively',
    walletType => {
      expect(
        swapValidator.canHandle(
          makeParams({
            request: makeRequest({
              context: {
                [RequestContext.SWAP_AUTO_APPROVE]: baseContext,
                [RequestContext.QUICK_SWAPS_AVAILABLE]: true,
                walletType
              } as never
            })
          })
        )
      ).toBe(false)
    }
  )

  it('rejects when walletType is missing from context (allowlist fails closed)', () => {
    expect(
      swapValidator.canHandle(
        makeParams({
          request: makeRequest({
            context: {
              [RequestContext.SWAP_AUTO_APPROVE]: baseContext,
              [RequestContext.QUICK_SWAPS_AVAILABLE]: true
            } as never
          })
        })
      )
    ).toBe(false)
  })

  it('rejects when QUICK_SWAPS_AVAILABLE is false (kill switch flipped)', () => {
    expect(
      swapValidator.canHandle(
        makeParams({
          request: makeRequest({
            context: {
              [RequestContext.SWAP_AUTO_APPROVE]: baseContext,
              [RequestContext.QUICK_SWAPS_AVAILABLE]: false,
              walletType: WalletType.MNEMONIC
            } as never
          })
        })
      )
    ).toBe(false)
  })
})

describe('swapValidator.validate (smoke — full coverage in shared.test.ts)', () => {
  it('delegates to runValidateAndCapture and returns isValid:true on a clean params object', async () => {
    const result = await swapValidator.validate(makeParams())
    expect(result.isValid).toBe(true)
  })
})
