import {
  TokenType as SdkTokenType,
  type Asset,
  type Chain,
  type Quote
} from '@avalabs/fusion-sdk'
import FusionService from 'features/swap/services/FusionService'
import { useIsFusionServiceReady } from 'features/swap/hooks/useZustandStore'
import { trackFusionTransfer } from 'features/swap/store/actions'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { formatUnits, parseUnits } from 'viem'
import {
  CCHAIN_CAIP2,
  CCHAIN_RPC_URL,
  HYPERLIQUID_ASSET,
  HYPERLIQUID_CHAIN,
  HYPERLIQUID_USDC_DECIMALS,
  USDC_CCHAIN_ADDRESS
} from '../consts'
import { useCChainUsdc } from './useCChainUsdc'
import { usePerpsClearinghouse } from './usePerpsClearinghouse'

/**
 * Fixed-route Markr withdrawal: Hyperliquid perp USDC (`eip155:1337`, 8 dp) ->
 * Avalanche C-Chain USDC. Mirrors {@link usePerpsDeposit} in reverse; the
 * two-phase EIP-712 signature flow is owned by fusion-sdk's Markr Hyperliquid
 * handler. Requires `@avalabs/fusion-sdk` >= 0.25 (Hyperliquid source support).
 */

export type UsePerpsWithdrawResult = {
  bestQuote: Quote | undefined
  isQuoting: boolean
  quoteError: Error | null
  canWithdraw: boolean
  isWithdrawing: boolean
  isServiceReady: boolean
  withdrawableUsd: number | undefined
  isWithdrawableLoading: boolean
  isWithdrawableUnavailable: boolean
  refetchWithdrawable: () => void
  exceedsWithdrawable: boolean
  /** USDC the wallet will receive on C-Chain after bridge fees, from the quote. */
  estimatedReceive: number | undefined
  executeWithdraw: (quote: Quote) => Promise<void>
}

export const usePerpsWithdraw = (
  amountString: string
): UsePerpsWithdrawResult => {
  const dispatch = useDispatch()
  const activeAccount = useSelector(selectActiveAccount)
  const evmAddress = activeAccount?.addressC
  const { decimals: cChainUsdcDecimals } = useCChainUsdc()
  const {
    withdrawableUsd,
    isWithdrawableLoading,
    isWithdrawableUnavailable,
    refetch: refetchWithdrawable
  } = usePerpsClearinghouse()
  const [isFusionServiceReady] = useIsFusionServiceReady()

  const [debouncedAmount, setDebouncedAmount] = useState(amountString)
  const [bestQuote, setBestQuote] = useState<Quote | undefined>(undefined)
  const [quoteError, setQuoteError] = useState<Error | null>(null)
  const [isQuoting, setIsQuoting] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedAmount(amountString), 400)
    return () => clearTimeout(handle)
  }, [amountString])

  const numericAmount = useMemo(() => {
    const parsed = Number.parseFloat(debouncedAmount)
    return Number.isFinite(parsed) ? parsed : 0
  }, [debouncedAmount])

  const exceedsWithdrawable =
    withdrawableUsd !== undefined && numericAmount > withdrawableUsd

  const amountUnits = useMemo(() => {
    if (
      withdrawableUsd === undefined ||
      debouncedAmount.trim() === '' ||
      exceedsWithdrawable
    ) {
      return undefined
    }
    try {
      const units = parseUnits(debouncedAmount, HYPERLIQUID_USDC_DECIMALS)
      return units > 0n ? units : undefined
    } catch {
      return undefined
    }
  }, [debouncedAmount, exceedsWithdrawable, withdrawableUsd])

  const targetAsset = useMemo<Asset>(
    () => ({
      type: SdkTokenType.ERC20,
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: cChainUsdcDecimals,
      address: USDC_CCHAIN_ADDRESS as `0x${string}`
    }),
    [cChainUsdcDecimals]
  )

  const targetChain = useMemo<Chain>(
    () => ({
      chainId: CCHAIN_CAIP2,
      chainName: 'Avalanche C-Chain',
      rpcUrl: CCHAIN_RPC_URL,
      networkToken: {
        type: SdkTokenType.NATIVE,
        name: 'Avalanche',
        symbol: 'AVAX',
        decimals: 18
      }
    }),
    []
  )

  useEffect(() => {
    if (
      !isFusionServiceReady ||
      evmAddress === undefined ||
      amountUnits === undefined
    ) {
      setBestQuote(undefined)
      setQuoteError(null)
      setIsQuoting(false)
      return
    }

    setIsQuoting(true)
    setQuoteError(null)

    let quoter: ReturnType<typeof FusionService.getQuoter> = null
    try {
      quoter = FusionService.getQuoter({
        fromAddress: evmAddress,
        toAddress: evmAddress,
        sourceAsset: HYPERLIQUID_ASSET,
        sourceChain: HYPERLIQUID_CHAIN,
        targetAsset,
        targetChain,
        amount: amountUnits,
        slippageBps: undefined
      })
    } catch (err) {
      setQuoteError(err instanceof Error ? err : new Error('Failed to quote'))
      setIsQuoting(false)
      return
    }

    if (quoter === null) {
      setIsQuoting(false)
      return
    }

    const unsubscribe = quoter.subscribe((event, data) => {
      switch (event) {
        case 'quote':
          setBestQuote(data.bestQuote ?? undefined)
          setIsQuoting(false)
          setQuoteError(null)
          break
        case 'error':
          setQuoteError(data)
          setIsQuoting(false)
          break
        case 'done':
          setIsQuoting(false)
          break
      }
    })

    return () => {
      unsubscribe()
    }
  }, [isFusionServiceReady, evmAddress, amountUnits, targetAsset, targetChain])

  const executeWithdraw = useCallback(
    async (quote: Quote) => {
      setIsWithdrawing(true)
      try {
        // Withdrawal source has no on-chain gas (the HL action is signed via
        // EIP-712 and POSTed), so no gas margin is applied.
        const transfer = await FusionService.transferAsset(quote, {})
        dispatch(
          trackFusionTransfer({
            transfer,
            quote,
            userClickedMax: false,
            sourceTokenSymbol: 'USDC',
            destinationTokenAddress: USDC_CCHAIN_ADDRESS,
            destinationTokenSymbol: 'USDC'
          })
        )
        if (transfer.status === 'failed') {
          throw new Error(transfer.errorReason ?? 'Withdrawal failed')
        }
      } finally {
        setIsWithdrawing(false)
      }
    },
    [dispatch]
  )

  const estimatedReceive = useMemo(() => {
    if (bestQuote === undefined) {
      return undefined
    }
    return Number(formatUnits(bestQuote.amountOut, bestQuote.assetOut.decimals))
  }, [bestQuote])

  const canWithdraw =
    isFusionServiceReady &&
    bestQuote !== undefined &&
    !isQuoting &&
    quoteError === null &&
    withdrawableUsd !== undefined &&
    !exceedsWithdrawable &&
    evmAddress !== undefined &&
    amountString === debouncedAmount

  return {
    bestQuote,
    isQuoting,
    quoteError,
    canWithdraw,
    isWithdrawing,
    isServiceReady: isFusionServiceReady,
    withdrawableUsd,
    isWithdrawableLoading,
    isWithdrawableUnavailable,
    refetchWithdrawable,
    exceedsWithdrawable,
    estimatedReceive,
    executeWithdraw
  }
}
