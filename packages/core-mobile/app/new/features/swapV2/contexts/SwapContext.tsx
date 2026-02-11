import React, {
  createContext,
  Dispatch,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react'
import { SwapSide } from '@paraswap/sdk'
import { LocalTokenWithBalance } from 'store/balance'
import {
  NormalizedSwapQuoteResult,
  NormalizedSwapQuote,
  SwapProviders
} from '../types'
import {
  useQuotes,
  useSwapSelectedFromToken,
  useSwapSelectedToToken
} from '../hooks/useZustandStore'
import { getTokenAddress } from '../utils/getTokenAddress'

const DEFAULT_SLIPPAGE = 0.2

// success here just means the transaction was sent, not that it was successful/confirmed
type SwapStatus = 'Idle' | 'Swapping' | 'Success' | 'Fail'

interface SwapContextState {
  fromToken?: LocalTokenWithBalance
  toToken?: LocalTokenWithBalance
  setFromToken: Dispatch<LocalTokenWithBalance | undefined>
  setToToken: Dispatch<LocalTokenWithBalance | undefined>
  quotes: NormalizedSwapQuoteResult | undefined
  isFetchingQuote: boolean
  swap(
    specificProvider?: SwapProviders,
    specificQuote?: NormalizedSwapQuote
  ): void
  slippage: number
  setSlippage: Dispatch<number>
  autoSlippage: boolean
  setAutoSlippage: Dispatch<boolean>
  destination: SwapSide
  setDestination: Dispatch<SwapSide>
  swapStatus: SwapStatus
  setAmount: Dispatch<bigint | undefined>
  error: string
}

export const SwapContext = createContext<SwapContextState>(
  {} as SwapContextState
)

export const SwapContextProvider = ({
  children
}: {
  children: ReactNode
}): JSX.Element => {
  const [fromToken, setFromToken] = useSwapSelectedFromToken()
  const [toToken, setToToken] = useSwapSelectedToToken()
  const [slippage, setSlippage] = useState<number>(DEFAULT_SLIPPAGE)
  const [autoSlippage, setAutoSlippage] = useState<boolean>(true)
  const [destination, setDestination] = useState<SwapSide>(SwapSide.SELL)
  const [swapStatus, setSwapStatus] = useState<SwapStatus>('Idle')
  const [amount, setAmount] = useState<bigint>()
  const [isFetchingQuote, setIsFetchingQuote] = useState(false)
  const [quotes, setQuotes] = useQuotes()
  const [error, setError] = useState('')

  // Auto-fetch mock quotes when amount/tokens change
  useEffect(() => {
    if (amount && fromToken && toToken) {
      const fetchMockQuote = async (): Promise<void> => {
        setIsFetchingQuote(true)
        setError('')

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500))

        // Calculate mock output amounts with different rates for different providers
        const mockOutputAmount1 = (BigInt(amount) * BigInt(152)) / BigInt(100) // 1:1.52 (best rate)
        const mockOutputAmount2 = (BigInt(amount) * BigInt(150)) / BigInt(100) // 1:1.50
        const mockOutputAmount3 = (BigInt(amount) * BigInt(148)) / BigInt(100) // 1:1.48

        const tokenInAddress =
          getTokenAddress(fromToken) ||
          '0x0000000000000000000000000000000000000000'
        const tokenOutAddress =
          getTokenAddress(toToken) ||
          '0x0000000000000000000000000000000000000000'

        // Create mock quote with multiple providers
        const mockQuote: NormalizedSwapQuoteResult = {
          provider: SwapProviders.MARKR,
          quotes: [
            {
              quote: {
                uuid: 'mock-uuid-1',
                aggregator: {
                  id: '1inch',
                  name: '1inch',
                  logo_url: 'https://example.com/1inch-logo.png'
                },
                amountIn: amount.toString(),
                amountOut: mockOutputAmount1.toString(),
                tokenIn: tokenInAddress,
                tokenOut: tokenOutAddress,
                recommendedSlippage: 200
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } as any,
              metadata: {
                amountIn: amount.toString(),
                amountOut: mockOutputAmount1.toString()
              }
            },
            {
              quote: {
                uuid: 'mock-uuid-2',
                aggregator: {
                  id: 'paraswap',
                  name: 'ParaSwap',
                  logo_url: 'https://example.com/paraswap-logo.png'
                },
                amountIn: amount.toString(),
                amountOut: mockOutputAmount2.toString(),
                tokenIn: tokenInAddress,
                tokenOut: tokenOutAddress,
                recommendedSlippage: 250
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } as any,
              metadata: {
                amountIn: amount.toString(),
                amountOut: mockOutputAmount2.toString()
              }
            },
            {
              quote: {
                uuid: 'mock-uuid-3',
                aggregator: {
                  id: 'uniswap',
                  name: 'Uniswap',
                  logo_url: 'https://example.com/uniswap-logo.png'
                },
                amountIn: amount.toString(),
                amountOut: mockOutputAmount3.toString(),
                tokenIn: tokenInAddress,
                tokenOut: tokenOutAddress,
                recommendedSlippage: 300
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } as any,
              metadata: {
                amountIn: amount.toString(),
                amountOut: mockOutputAmount3.toString()
              }
            }
          ],
          // Select the first quote (best rate) by default
          selected: {
            quote: {
              uuid: 'mock-uuid-1',
              aggregator: {
                id: '1inch',
                name: '1inch',
                logo_url: 'https://example.com/1inch-logo.png'
              },
              amountIn: amount.toString(),
              amountOut: mockOutputAmount1.toString(),
              tokenIn: tokenInAddress,
              tokenOut: tokenOutAddress,
              recommendedSlippage: 200
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
            metadata: {
              amountIn: amount.toString(),
              amountOut: mockOutputAmount1.toString()
            }
          }
        }

        setQuotes(mockQuote)
        setIsFetchingQuote(false)
      }

      fetchMockQuote()
    } else {
      // Clear quotes if no amount or tokens
      setQuotes(undefined)
    }
  }, [amount, fromToken, toToken, setQuotes, setIsFetchingQuote, setError])

  // Stub swap function - logs to console
  const swap = useCallback(
    async (
      specificProvider?: SwapProviders,
      specificQuote?: NormalizedSwapQuote
    ) => {
      // eslint-disable-next-line no-console
      console.log('Swap stub called - implement your own logic')
      // eslint-disable-next-line no-console
      console.log({
        fromToken,
        toToken,
        amount,
        slippage,
        specificProvider,
        specificQuote
      })

      setSwapStatus('Idle')
    },
    [fromToken, toToken, amount, slippage]
  )

  const value: SwapContextState = {
    fromToken,
    setFromToken,
    toToken,
    setToToken,
    quotes,
    isFetchingQuote,
    swap,
    slippage,
    setSlippage,
    autoSlippage,
    setAutoSlippage,
    destination,
    setDestination,
    swapStatus,
    setAmount,
    error
  }

  return <SwapContext.Provider value={value}>{children}</SwapContext.Provider>
}

export const useSwapContext = (): SwapContextState => {
  const context = useContext(SwapContext)
  if (context === undefined) {
    throw new Error('useSwapContext must be used within a SwapContextProvider')
  }
  return context
}
