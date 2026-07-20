import {
  TokenType as SdkTokenType,
  type Asset,
  type Chain,
  type GasSettings,
  type Quote
} from '@avalabs/fusion-sdk'
import FusionService from 'features/swap/services/FusionService'
import { useIsFusionServiceReady } from 'features/swap/hooks/useZustandStore'
import { trackFusionTransfer } from 'features/swap/store/actions'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { parseUnits } from 'viem'
import {
  CCHAIN_CAIP2,
  CCHAIN_RPC_URL,
  HYPERLIQUID_ASSET,
  HYPERLIQUID_CHAIN,
  USDC_CCHAIN_ADDRESS
} from '../consts'
import { useCChainUsdc } from './useCChainUsdc'

/**
 * Fixed-route Markr deposit: Avalanche C-Chain USDC -> Hyperliquid
 * (chain `eip155:1337`). Mirrors core-web's `usePerpsDeposit`, using mobile's
 * `FusionService` singleton for quoting + execution. Signing/approvals are
 * handled by the EVM signer already wired into FusionService at init.
 */
const DEPOSIT_GAS_MARGIN_BPS = 2000

export type UsePerpsDepositResult = {
  bestQuote: Quote | undefined
  isQuoting: boolean
  quoteError: Error | null
  canDeposit: boolean
  isDepositing: boolean
  isServiceReady: boolean
  executeDeposit: (quote: Quote) => Promise<void>
}

export const usePerpsDeposit = (
  amountString: string
): UsePerpsDepositResult => {
  const dispatch = useDispatch()
  const activeAccount = useSelector(selectActiveAccount)
  const evmAddress = activeAccount?.addressC
  const { decimals } = useCChainUsdc()
  const [isFusionServiceReady] = useIsFusionServiceReady()

  const [debouncedAmount, setDebouncedAmount] = useState(amountString)
  const [bestQuote, setBestQuote] = useState<Quote | undefined>(undefined)
  const [quoteError, setQuoteError] = useState<Error | null>(null)
  const [isQuoting, setIsQuoting] = useState(false)
  const [isDepositing, setIsDepositing] = useState(false)

  // Debounce so we don't spin up a quoter on every keystroke.
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedAmount(amountString), 400)
    return () => clearTimeout(handle)
  }, [amountString])

  const amountUnits = useMemo(() => {
    if (debouncedAmount.trim() === '') {
      return undefined
    }
    try {
      const units = parseUnits(debouncedAmount, decimals)
      return units > 0n ? units : undefined
    } catch {
      return undefined
    }
  }, [debouncedAmount, decimals])

  const sourceAsset = useMemo<Asset>(
    () => ({
      type: SdkTokenType.ERC20,
      name: 'USD Coin',
      symbol: 'USDC',
      decimals,
      address: USDC_CCHAIN_ADDRESS as `0x${string}`
    }),
    [decimals]
  )

  const sourceChain = useMemo<Chain>(
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
        sourceAsset,
        sourceChain,
        targetAsset: HYPERLIQUID_ASSET,
        targetChain: HYPERLIQUID_CHAIN,
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
  }, [isFusionServiceReady, evmAddress, amountUnits, sourceAsset, sourceChain])

  const executeDeposit = useCallback(
    async (quote: Quote) => {
      setIsDepositing(true)
      try {
        const gasSettings: GasSettings = {
          estimateGasMarginBps: DEPOSIT_GAS_MARGIN_BPS
        }
        const transfer = await FusionService.transferAsset(quote, gasSettings)
        dispatch(
          trackFusionTransfer({
            transfer,
            quote,
            userClickedMax: false,
            sourceTokenAddress: USDC_CCHAIN_ADDRESS,
            sourceTokenSymbol: 'USDC',
            destinationTokenSymbol: 'USDC'
          })
        )
      } finally {
        setIsDepositing(false)
      }
    },
    [dispatch]
  )

  const canDeposit =
    isFusionServiceReady &&
    bestQuote !== undefined &&
    !isQuoting &&
    quoteError === null &&
    evmAddress !== undefined &&
    amountString === debouncedAmount

  return {
    bestQuote,
    isQuoting,
    quoteError,
    canDeposit,
    isDepositing,
    isServiceReady: isFusionServiceReady,
    executeDeposit
  }
}
