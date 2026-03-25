import { TransferStepDetails } from '@avalabs/fusion-sdk'
import { isAvalancheChainId } from 'services/network/utils/isAvalancheNetwork'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'
import { RequestContext } from 'store/rpc/types'
import { buildRequestContext } from './buildRequestContext'

jest.mock('services/network/utils/isAvalancheNetwork', () => ({
  isAvalancheChainId: jest.fn()
}))
jest.mock('utils/caip2ChainIds', () => ({
  getChainIdFromCaip2: jest.fn()
}))

const mockIsAvalancheChainId = isAvalancheChainId as jest.Mock
const mockGetChainIdFromCaip2 = getChainIdFromCaip2 as jest.Mock

const AVAX_CHAIN_ID = 'eip155:43114'
const BTC_CHAIN_ID = 'bip122:000000000019d6689c085ae165831e93'
const SOLANA_CHAIN_ID = 'solana:mainnet'

function makeStepDetails(
  overrides: Partial<
    Pick<TransferStepDetails, 'currentSignature' | 'requiredSignatures'> & {
      sourceChainId: string
      targetChainId: string
    }
  > = {}
): TransferStepDetails {
  const {
    currentSignature = 1,
    requiredSignatures = 1,
    sourceChainId = AVAX_CHAIN_ID,
    targetChainId = AVAX_CHAIN_ID
  } = overrides

  return {
    currentSignature,
    requiredSignatures,
    currentSignatureReason: 'swap',
    quote: {
      sourceChain: { chainId: sourceChainId },
      targetChain: { chainId: targetChainId }
    }
  } as unknown as TransferStepDetails
}

describe('buildRequestContext', () => {
  beforeEach(() => {
    // Default: non-Avalanche chain
    mockGetChainIdFromCaip2.mockReturnValue(1)
    mockIsAvalancheChainId.mockReturnValue(false)
  })

  describe(`${RequestContext.SUPPRESS_TX_FEEDBACK}`, () => {
    it('is absent for a single-step same-chain swap', () => {
      const ctx = buildRequestContext(
        makeStepDetails({ currentSignature: 1, requiredSignatures: 1 })
      )
      expect(ctx[RequestContext.SUPPRESS_TX_FEEDBACK]).toBeUndefined()
    })

    it('is true for an intermediate step (currentSignature < requiredSignatures)', () => {
      const ctx = buildRequestContext(
        makeStepDetails({ currentSignature: 1, requiredSignatures: 2 })
      )
      expect(ctx[RequestContext.SUPPRESS_TX_FEEDBACK]).toBe(true)
    })

    it('is absent for the final step of a multi-step same-chain swap', () => {
      const ctx = buildRequestContext(
        makeStepDetails({ currentSignature: 2, requiredSignatures: 2 })
      )
      expect(ctx[RequestContext.SUPPRESS_TX_FEEDBACK]).toBeUndefined()
    })

    it('is true for a cross-chain swap (final step)', () => {
      const ctx = buildRequestContext(
        makeStepDetails({
          currentSignature: 1,
          requiredSignatures: 1,
          sourceChainId: AVAX_CHAIN_ID,
          targetChainId: BTC_CHAIN_ID
        })
      )
      expect(ctx[RequestContext.SUPPRESS_TX_FEEDBACK]).toBe(true)
    })

    it('is true for a cross-chain intermediate step', () => {
      const ctx = buildRequestContext(
        makeStepDetails({
          currentSignature: 1,
          requiredSignatures: 2,
          sourceChainId: AVAX_CHAIN_ID,
          targetChainId: BTC_CHAIN_ID
        })
      )
      expect(ctx[RequestContext.SUPPRESS_TX_FEEDBACK]).toBe(true)
    })
  })

  describe(`${RequestContext.IMMEDIATE_SENT_TOAST}`, () => {
    it('is true for a non-Avalanche same-chain final step', () => {
      const ctx = buildRequestContext(makeStepDetails())
      expect(ctx[RequestContext.IMMEDIATE_SENT_TOAST]).toBe(true)
    })

    it('is absent for an Avalanche same-chain final step (ApprovalController handles it)', () => {
      mockGetChainIdFromCaip2.mockReturnValue(43114)
      mockIsAvalancheChainId.mockReturnValue(true)

      const ctx = buildRequestContext(
        makeStepDetails({
          sourceChainId: AVAX_CHAIN_ID,
          targetChainId: AVAX_CHAIN_ID
        })
      )
      expect(ctx[RequestContext.IMMEDIATE_SENT_TOAST]).toBeUndefined()
    })

    it('is absent for a cross-chain swap (SUPPRESS_TX_FEEDBACK handles it)', () => {
      const ctx = buildRequestContext(
        makeStepDetails({
          sourceChainId: AVAX_CHAIN_ID,
          targetChainId: BTC_CHAIN_ID
        })
      )
      expect(ctx[RequestContext.IMMEDIATE_SENT_TOAST]).toBeUndefined()
    })

    it('is absent for an intermediate step (SUPPRESS_TX_FEEDBACK handles it)', () => {
      const ctx = buildRequestContext(
        makeStepDetails({ currentSignature: 1, requiredSignatures: 2 })
      )
      expect(ctx[RequestContext.IMMEDIATE_SENT_TOAST]).toBeUndefined()
    })
  })

  describe(`${RequestContext.CONFETTI_DISABLED}`, () => {
    it('is true for a non-Avalanche same-chain final step', () => {
      const ctx = buildRequestContext(
        makeStepDetails({
          sourceChainId: SOLANA_CHAIN_ID,
          targetChainId: SOLANA_CHAIN_ID
        })
      )
      expect(ctx[RequestContext.CONFETTI_DISABLED]).toBe(true)
    })

    it('is absent for an Avalanche same-chain final step (confetti fires in onTransactionPending)', () => {
      mockGetChainIdFromCaip2.mockReturnValue(43114)
      mockIsAvalancheChainId.mockReturnValue(true)

      const ctx = buildRequestContext(
        makeStepDetails({
          sourceChainId: AVAX_CHAIN_ID,
          targetChainId: AVAX_CHAIN_ID
        })
      )
      expect(ctx[RequestContext.CONFETTI_DISABLED]).toBeUndefined()
    })

    it('is absent for a cross-chain swap (SUPPRESS_TX_FEEDBACK handles it)', () => {
      const ctx = buildRequestContext(
        makeStepDetails({
          sourceChainId: AVAX_CHAIN_ID,
          targetChainId: BTC_CHAIN_ID
        })
      )
      expect(ctx[RequestContext.CONFETTI_DISABLED]).toBeUndefined()
    })

    it('is absent for an intermediate step (SUPPRESS_TX_FEEDBACK handles it)', () => {
      const ctx = buildRequestContext(
        makeStepDetails({ currentSignature: 1, requiredSignatures: 2 })
      )
      expect(ctx[RequestContext.CONFETTI_DISABLED]).toBeUndefined()
    })
  })

  describe(`${RequestContext.SUCCESS_TOAST_DISABLED}`, () => {
    it('is true for a non-Avalanche same-chain final step', () => {
      const ctx = buildRequestContext(makeStepDetails())
      expect(ctx[RequestContext.SUCCESS_TOAST_DISABLED]).toBe(true)
    })

    it('is absent for an Avalanche same-chain final step (ApprovalController handles it)', () => {
      mockGetChainIdFromCaip2.mockReturnValue(43114)
      mockIsAvalancheChainId.mockReturnValue(true)

      const ctx = buildRequestContext(
        makeStepDetails({
          sourceChainId: AVAX_CHAIN_ID,
          targetChainId: AVAX_CHAIN_ID
        })
      )
      expect(ctx[RequestContext.SUCCESS_TOAST_DISABLED]).toBeUndefined()
    })

    it('is absent for a cross-chain swap (SUPPRESS_TX_FEEDBACK handles it)', () => {
      const ctx = buildRequestContext(
        makeStepDetails({
          sourceChainId: AVAX_CHAIN_ID,
          targetChainId: BTC_CHAIN_ID
        })
      )
      expect(ctx[RequestContext.SUCCESS_TOAST_DISABLED]).toBeUndefined()
    })

    it('is absent for an intermediate step (SUPPRESS_TX_FEEDBACK handles it)', () => {
      const ctx = buildRequestContext(
        makeStepDetails({ currentSignature: 1, requiredSignatures: 2 })
      )
      expect(ctx[RequestContext.SUCCESS_TOAST_DISABLED]).toBeUndefined()
    })
  })
})
