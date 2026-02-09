import { SwapProviders, NormalizedSwapQuoteResult } from './types'

// Mock quote data structure for UI demonstration
export const MOCK_QUOTE: NormalizedSwapQuoteResult = {
  provider: SwapProviders.MARKR,
  quotes: [
    {
      quote: {
        uuid: 'mock-uuid-123',
        aggregator: {
          id: '1inch',
          name: '1inch',
          logo_url: 'https://example.com/1inch-logo.png'
        },
        amountIn: '1000000000000000000', // 1 token
        amountOut: '1234000000', // 1234 tokens
        tokenIn: '0x0000000000000000000000000000000000000000',
        tokenOut: '0x0000000000000000000000000000000000000000',
        recommendedSlippage: 200 // 2%
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      metadata: {
        amountIn: '1000000000000000000',
        amountOut: '1234000000'
      }
    }
  ],
  selected: {
    quote: {
      uuid: 'mock-uuid-123',
      aggregator: {
        id: '1inch',
        name: '1inch',
        logo_url: 'https://example.com/1inch-logo.png'
      },
      amountIn: '1000000000000000000',
      amountOut: '1234000000',
      tokenIn: '0x0000000000000000000000000000000000000000',
      tokenOut: '0x0000000000000000000000000000000000000000',
      recommendedSlippage: 200
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    metadata: {
      amountIn: '1000000000000000000',
      amountOut: '1234000000'
    }
  }
}
