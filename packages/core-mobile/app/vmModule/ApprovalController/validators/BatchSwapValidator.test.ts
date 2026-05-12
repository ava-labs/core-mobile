import { type RpcRequest } from '@avalabs/vm-module-types'
import { WalletType } from 'services/wallet/types'
import {
  CORE_MOBILE_TOPIC,
  RequestContext,
  RpcMethod,
  type SwapAutoApproveContext
} from 'store/rpc/types'

jest.mock('services/analytics/AnalyticsService', () => ({
  __esModule: true,
  default: { capture: jest.fn() }
}))

import { batchSwapValidator } from './BatchSwapValidator'

// Behavioural cases for validate()/telemetry live in shared.test.ts.
// This file only covers canHandle (the only thing specific to the
// batch validator).

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

const makeBatchRequest = (overrides: Partial<RpcRequest> = {}): RpcRequest =>
  ({
    requestId: 'req-1',
    sessionId: CORE_MOBILE_TOPIC,
    method: RpcMethod.ETH_SEND_TRANSACTION_BATCH,
    chainId: 'eip155:43114',
    dappInfo: { name: 'Core', url: '', icon: '' },
    context: {
      [RequestContext.SWAP_AUTO_APPROVE]: baseContext,
      [RequestContext.QUICK_SWAPS_AVAILABLE]: true,
      walletType: WalletType.MNEMONIC
    },
    ...overrides
  } as unknown as RpcRequest)

describe('BatchSwapValidator.canHandle', () => {
  it('matches an in-app batch request with SWAP_AUTO_APPROVE context and software wallet', () => {
    expect(batchSwapValidator.canHandle(makeBatchRequest())).toBe(true)
  })

  it('rejects requests not from in-app code (e.g. external dApp)', () => {
    expect(
      batchSwapValidator.canHandle(
        makeBatchRequest({ sessionId: 'wc-topic-external' })
      )
    ).toBe(false)
  })

  it('rejects requests using a different RPC method', () => {
    expect(
      batchSwapValidator.canHandle(
        makeBatchRequest({
          method: 'eth_sendTransaction' as unknown as RpcRequest['method']
        })
      )
    ).toBe(false)
  })

  it('rejects when swapAutoApprove is missing from context', () => {
    expect(
      batchSwapValidator.canHandle(
        makeBatchRequest({
          context: { walletType: WalletType.MNEMONIC } as never
        })
      )
    ).toBe(false)
  })

  it.each([WalletType.LEDGER, WalletType.LEDGER_LIVE, WalletType.KEYSTONE])(
    'rejects %s wallets defensively',
    walletType => {
      expect(
        batchSwapValidator.canHandle(
          makeBatchRequest({
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

  it('rejects when walletType is missing from context (allowlist fails closed)', () => {
    expect(
      batchSwapValidator.canHandle(
        makeBatchRequest({
          context: {
            [RequestContext.SWAP_AUTO_APPROVE]: baseContext,
            [RequestContext.QUICK_SWAPS_AVAILABLE]: true
          } as never
        })
      )
    ).toBe(false)
  })

  it('rejects when QUICK_SWAPS_AVAILABLE is false (kill switch flipped)', () => {
    expect(
      batchSwapValidator.canHandle(
        makeBatchRequest({
          context: {
            [RequestContext.SWAP_AUTO_APPROVE]: baseContext,
            [RequestContext.QUICK_SWAPS_AVAILABLE]: false,
            walletType: WalletType.MNEMONIC
          } as never
        })
      )
    ).toBe(false)
  })
})
