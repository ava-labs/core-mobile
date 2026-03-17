import { TransferStepDetails } from '@avalabs/fusion-sdk'
import { RequestContext } from 'store/rpc/types'
import { buildRequestContext } from './buildRequestContext'

const AVAX_CHAIN_ID = 'eip155:43114'
const BTC_CHAIN_ID = 'bip122:000000000019d6689c085ae165831e93'

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
  describe(`${RequestContext.TOASTS_AND_CONFETTI_DISABLED}`, () => {
    it('is false for a single-step same-chain swap', () => {
      const ctx = buildRequestContext(
        makeStepDetails({ currentSignature: 1, requiredSignatures: 1 })
      )
      expect(ctx[RequestContext.TOASTS_AND_CONFETTI_DISABLED]).toBe(false)
    })

    it('is true for an intermediate step (currentSignature < requiredSignatures)', () => {
      const ctx = buildRequestContext(
        makeStepDetails({ currentSignature: 1, requiredSignatures: 2 })
      )
      expect(ctx[RequestContext.TOASTS_AND_CONFETTI_DISABLED]).toBe(true)
    })

    it('is false for the final step of a multi-step same-chain swap', () => {
      const ctx = buildRequestContext(
        makeStepDetails({ currentSignature: 2, requiredSignatures: 2 })
      )
      expect(ctx[RequestContext.TOASTS_AND_CONFETTI_DISABLED]).toBe(false)
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
      expect(ctx[RequestContext.TOASTS_AND_CONFETTI_DISABLED]).toBe(true)
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
      expect(ctx[RequestContext.TOASTS_AND_CONFETTI_DISABLED]).toBe(true)
    })
  })
})
