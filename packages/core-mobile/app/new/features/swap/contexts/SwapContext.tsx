import React, {
  createContext,
  Dispatch,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo
} from 'react'
import { showAlert } from '@avalabs/k2-alpine'
import { SwapSide } from '@paraswap/sdk'
import { LocalTokenWithBalance } from 'store/balance'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { getAddressByNetwork } from 'store/account/utils'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useNetworkFee } from 'hooks/useNetworkFee'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { showSnackbar, transactionSnackbar } from 'common/utils/toast'
import Logger from 'utils/Logger'
import {
  selectMarkrSwapMaxRetries,
  selectFusionTransferGasMarginBps,
  selectIsFusionAvalancheCctEnabled
} from 'store/posthog'
import { audioFeedback, Audios } from 'utils/AudioFeedback'
// Nest Egg disabled (CP-14058) — see swapCompleted dispatch below
// import { swapCompleted } from 'store/nestEgg'
import { ServiceType, type GasSettings } from '@avalabs/fusion-sdk'
// import { bigintToBig } from '@avalabs/core-utils-sdk' // Nest Egg disabled (CP-14058)
import type { Quote, Transfer } from '../types'
import {
  useSwapSelectedFromToken,
  useSwapSelectedToToken,
  useBestQuote,
  useUserSelectedQuoteIds,
  useAutoAdvancedQuoteIds,
  useAllQuotes,
  useFusionTransfers
} from '../hooks/useZustandStore'
import { useQuoteStreaming } from '../hooks/useQuoteStreaming'
import { useQuickSwaps } from '../hooks/useQuickSwaps'
import FusionService from '../services/FusionService'
import {
  mapFeeSettingToGasSettings,
  SuggestedGasFees
} from '../utils/quickSwapsFee'
import {
  isUserRejectionError,
  shouldRetryWithNextQuote,
  getSwapErrorMessage
} from '../utils/fusionErrors'
import { trackFusionTransfer } from '../store/actions'
import { findNextQuote } from '../utils/findNextQuote'
import { isAvalancheCctZeroAmountRoute } from '../utils/isAvalancheCctRoute'
import { logSdkError } from '../utils/fusionLogger'
import { matchQuoteByIdentifiers } from '../utils/matchQuoteByIdentifiers'

const DEFAULT_SLIPPAGE = 0.2

export enum SwapStatus {
  Idle = 'Idle',
  Swapping = 'Swapping',
  Success = 'Success',
  Fail = 'Fail'
}

interface SwapContextState {
  fromToken?: LocalTokenWithBalance
  toToken?: LocalTokenWithBalance
  setFromToken: Dispatch<LocalTokenWithBalance | undefined>
  setToToken: Dispatch<LocalTokenWithBalance | undefined>
  bestQuote: Quote | null
  userQuote: Quote | null
  /**
   * Effective quote after precedence: userQuote > autoAdvancedQuote >
   * bestQuote. Single source of truth — consumers should prefer this over
   * recomputing the chain. autoAdvancedQuote is deliberately kept internal
   * so the pre-swap auto-advance can't mis-tag analytics or disable
   * swap-time retry.
   */
  activeQuote: Quote | null
  allQuotes: Quote[]
  isQuoteLoading: boolean
  quoteError: Error | null
  selectQuoteById: (quoteId: string | null) => void
  /** Promote a quote to the active position without marking it as a user pick. */
  advanceBestQuote: (quoteId: string) => void
  swap(quote: Quote): Promise<void>
  slippage: number
  setSlippage: Dispatch<number>
  autoSlippage: boolean
  setAutoSlippage: Dispatch<boolean>
  destination: SwapSide
  setDestination: Dispatch<SwapSide>
  swapStatus: SwapStatus
  /** Live source-token amount in smallest units. Exposed for consumers
   *  (e.g. the pricing details modal) that need to recompute downstream
   *  state (recurring quotes, fee breakdowns) outside the SwapScreen. */
  amount: bigint | undefined
  setAmount: Dispatch<bigint | undefined>
  /**
   * True iff the source amount was most-recently set by the Max button.
   * Cleared by any manual edit or by the 25%/50% percentage buttons.
   * Captured on `SwapFailed` analytics so we can quantify the cohort Eric
   * suspects (Markr toxic-pool quotes are more common on the small-amount
   * "minimum probe" path the Max button takes).
   */
  userClickedMax: boolean
  setUserClickedMax: Dispatch<boolean>
  /** ID of the transfer that was just successfully submitted */
  successTransferId: string | undefined
}

export const SwapContext = createContext<SwapContextState>(
  {} as SwapContextState
)

export const SwapContextProvider = ({
  children
}: {
  children: ReactNode
}): JSX.Element => {
  const dispatch = useDispatch()
  const [fromToken, setFromToken] = useSwapSelectedFromToken()
  const [toToken, setToToken] = useSwapSelectedToToken()
  const [slippage, setSlippage] = useState<number>(DEFAULT_SLIPPAGE)
  const [autoSlippage, setAutoSlippage] = useState<boolean>(true)
  const [destination, setDestination] = useState<SwapSide>(SwapSide.SELL)
  const [swapStatus, setSwapStatus] = useState<SwapStatus>(SwapStatus.Idle)
  const [successTransferId, setSuccessTransferId] = useState<
    string | undefined
  >()
  const isSwappingRef = useRef(false)
  const [amount, setAmount] = useState<bigint>()
  const [userClickedMax, setUserClickedMax] = useState<boolean>(false)

  // Get quotes
  const [bestQuote] = useBestQuote()
  const [userSelectedQuoteIds, setUserSelectedQuoteIds] =
    useUserSelectedQuoteIds()
  const [autoAdvancedQuoteIds, setAutoAdvancedQuoteIds] =
    useAutoAdvancedQuoteIds()
  const [allQuotes] = useAllQuotes()

  // Transfer storage
  const { setTransfers } = useFusionTransfers()

  // Resolve identifiers → Quote with fallback matching, so both manual and
  // auto-advanced selections stay sticky across quote refreshes.
  const userQuote = useMemo(
    () => matchQuoteByIdentifiers(userSelectedQuoteIds, allQuotes),
    [userSelectedQuoteIds, allQuotes]
  )

  // When the token pair changes, drop any stale auto-advanced identifier —
  // the previous pair's provider selection shouldn't influence the new pair's
  // default even if a provider's serviceType+aggregatorId happens to match.
  useEffect(() => {
    setAutoAdvancedQuoteIds(null)
  }, [fromToken?.localId, toToken?.localId, setAutoAdvancedQuoteIds])

  const autoAdvancedQuote = useMemo(
    () => matchQuoteByIdentifiers(autoAdvancedQuoteIds, allQuotes),
    [autoAdvancedQuoteIds, allQuotes]
  )

  // Precedence: user manual pick > auto-advanced promotion > stream best.
  // Centralised so all consumer screens (SwapScreen, pricing/slippage
  // modals) agree on which quote is currently in use.
  const activeQuote = userQuote ?? autoAdvancedQuote ?? bestQuote

  // Get account and networks
  const activeAccount = useSelector(selectActiveAccount)
  const maxRetries = useSelector(selectMarkrSwapMaxRetries)
  const transferGasMarginBps = useSelector(selectFusionTransferGasMarginBps)
  const isAvalancheCctEnabled = useSelector(selectIsFusionAvalancheCctEnabled)
  const { getNetwork } = useNetworks()
  const fromNetwork = useMemo(
    () => (fromToken ? getNetwork(fromToken.networkChainId) : undefined),
    [fromToken, getNetwork]
  )

  // Quick Swaps gas tier
  const { isEnabled: isQuickSwapsActive, feeSetting, maxBuy } = useQuickSwaps()
  const { data: networkFees } = useNetworkFee(fromNetwork)
  const toNetwork = useMemo(
    () => (toToken ? getNetwork(toToken.networkChainId) : undefined),
    [toToken, getNetwork]
  )

  // Get appropriate addresses for the networks (EVM uses addressC, SVM uses addressSVM, etc.)
  const fromAddress = useMemo(() => {
    if (!activeAccount || !fromNetwork) return undefined
    return getAddressByNetwork(activeAccount, fromNetwork)
  }, [activeAccount, fromNetwork])

  const toAddress = useMemo(() => {
    if (!activeAccount || !toNetwork) return undefined
    return getAddressByNetwork(activeAccount, toNetwork)
  }, [activeAccount, toNetwork])

  const onNoQuotesError = useCallback((retry: () => void) => {
    showAlert({
      title: 'Quotes unavailable',
      description: "We couldn't fetch quotes right now",
      buttons: [{ text: 'Close' }, { text: 'Try again', onPress: retry }]
    })
  }, [])

  // AVALANCHE_CCT routes accept amountIn=0 so the SDK can emit an import-only
  // recovery quote (recover stranded funds straight from the swap screen).
  const allowZeroAmount = isAvalancheCctZeroAmountRoute({
    isAvalancheCctEnabled,
    fromToken,
    toToken
  })

  // Subscribe to quote stream
  const { isLoading: isQuoteLoading, error: quoteError } = useQuoteStreaming({
    fromToken,
    fromNetwork,
    toToken,
    toNetwork,
    fromAmount: amount,
    fromAddress,
    toAddress,
    // When auto slippage is enabled, pass undefined to let SDK determine optimal slippage
    // When manual, use the user's specified slippage value
    slippageBps: autoSlippage ? undefined : slippage * 100,
    onNoQuotesError,
    allowZeroAmount
  })

  // Method to select a specific quote or auto mode. Also clears any
  // auto-advanced selection so the user's explicit choice (or their return
  // to Auto mode) takes full control.
  const selectQuoteById = useCallback(
    (quoteId: string | null) => {
      setAutoAdvancedQuoteIds(null)

      if (quoteId === null) {
        // Clear selection (Auto mode)
        setUserSelectedQuoteIds(null)
        return
      }

      // Find the quote to extract serviceType and aggregatorId
      const quote = allQuotes.find(q => q.id === quoteId)
      if (!quote) {
        setUserSelectedQuoteIds(null)
        return
      }

      // Store all identifiers for fallback matching
      setUserSelectedQuoteIds({
        quoteId: quote.id,
        serviceType: quote.serviceType,
        aggregatorId: quote.aggregator.id
      })
    },
    [allQuotes, setUserSelectedQuoteIds, setAutoAdvancedQuoteIds]
  )

  // Promote a quote to the active position without marking it as a user pick.
  // Used by the pre-swap auto-advance so swap-time retry (!userQuote gate) and
  // analytics (quoteSelectionMode) remain correctly classified as 'auto'.
  const advanceBestQuote = useCallback(
    (quoteId: string) => {
      const quote = allQuotes.find(q => q.id === quoteId)
      if (!quote) return

      setAutoAdvancedQuoteIds({
        quoteId: quote.id,
        serviceType: quote.serviceType,
        aggregatorId: quote.aggregator.id
      })
    },
    [allQuotes, setAutoAdvancedQuoteIds]
  )

  // Handle swap success: logging, storage, and analytics
  const handleSwapSuccess = useCallback(
    (params: {
      transfer: Transfer
      quote: Quote
      address: string
      targetAddress: string
      fromTokenData: LocalTokenWithBalance
      toTokenData: LocalTokenWithBalance
      quoteSelectionMode: 'manual' | 'auto'
      autoRetryAttempt?: number
      userClickedMax: boolean
    }) => {
      const {
        transfer,
        quote,
        address,
        targetAddress,
        fromTokenData,
        toTokenData,
        quoteSelectionMode,
        autoRetryAttempt,
        userClickedMax: maxClicked
      } = params
      const sourceTokenAddress =
        'address' in fromTokenData ? fromTokenData.address : undefined
      const destinationTokenAddress =
        'address' in toTokenData ? toTokenData.address : undefined
      audioFeedback(Audios.Send)
      AnalyticsService.capture('SwapConfirmed', {
        encrypted: {
          sourceAddress: address,
          targetAddress,
          sourceChainId: quote.sourceChain.chainId,
          targetChainId: quote.targetChain.chainId,
          sourceTxHash: transfer.source?.txHash,
          quoteSelectionMode,
          autoRetryAttempt
        },
        caip2SourceChainId: quote.sourceChain.chainId,
        caip2TargetChainId: quote.targetChain.chainId,
        quickSwapsEnabled: isQuickSwapsActive,
        quickSwapsFeeSetting: feeSetting,
        quickSwapsMaxBuy: maxBuy
      })

      Logger.info('[SwapContext] transfer executed', {
        transfer
      })

      // Store transfer in Zustand for tracking
      setTransfers(prev => ({
        ...prev,
        [transfer.id]: {
          transfer,
          fromToken: {
            localId: fromTokenData.localId,
            internalId: fromTokenData.internalId,
            logoUri: fromTokenData.logoUri
          },
          toToken: {
            localId: toTokenData.localId,
            internalId: toTokenData.internalId,
            logoUri: toTokenData.logoUri
          },
          timestamp: Date.now()
        }
      }))

      setSuccessTransferId(transfer.id)
      setSwapStatus(SwapStatus.Success)

      // Dispatch trackFusionTransfer to start tracking transfer status.
      // Carries the analytics context the listener needs to populate the
      // SwapFailed payload (userClickedMax, token metadata, quote aggregator)
      // since the SDK's Transfer object doesn't expose those fields.
      dispatch(
        trackFusionTransfer({
          transfer,
          quote,
          userClickedMax: maxClicked,
          sourceTokenAddress,
          sourceTokenSymbol: fromTokenData.symbol,
          destinationTokenAddress,
          destinationTokenSymbol: toTokenData.symbol
        })
      )

      // Nest Egg disabled (CP-14058): feature unused and linked to a blank,
      // un-dismissable modal on iOS. Commented out (not removed) so it can be
      // re-enabled later.
      //
      // Dispatch swapCompleted for Nest Egg qualification tracking.
      // Computed from `transfer.amountIn` (what actually swapped) not
      // the live `amount` state, so if the user changed the input
      // between submit and completion the analytics still reflect
      // reality. bigintToBig preserves precision that Number() would
      // lose on large amounts.
      // const swapTxHash = transfer.source?.txHash
      // if (
      //   swapTxHash &&
      //   transfer.amountIn &&
      //   fromTokenData.priceInCurrency !== undefined &&
      //   'decimals' in fromTokenData
      // ) {
      //   const fromAmountUsd = bigintToBig(
      //     BigInt(transfer.amountIn),
      //     fromTokenData.decimals
      //   )
      //     .times(fromTokenData.priceInCurrency)
      //     .toNumber()
      //   dispatch(
      //     swapCompleted({
      //       txHash: swapTxHash,
      //       chainId: Number(quote.sourceChain.chainId.split(':')[1]),
      //       fromTokenSymbol: fromTokenData.symbol,
      //       toTokenSymbol: toTokenData.symbol,
      //       fromAmountUsd,
      //       toAmountUsd: fromAmountUsd
      //     })
      //   )
      // }
    },
    [dispatch, setTransfers, isQuickSwapsActive, feeSetting, maxBuy]
  )

  // Handle swap error: logging, toast
  const handleSwapError = useCallback((error: unknown) => {
    setSwapStatus(SwapStatus.Fail)

    // Show error toast (only for non-transaction errors)
    transactionSnackbar.error({
      message: 'Swap failed',
      error: getSwapErrorMessage(error)
    })

    logSdkError('[handleSwapError] error', error)
  }, [])

  // Swap execution with retry logic
  const swap = useCallback(
    // eslint-disable-next-line sonarjs/cognitive-complexity
    async (quote: Quote, retryQuote?: Quote, retries = 0) => {
      // Guard against concurrent swap executions on initial call (ref is synchronous, unlike state)
      if (retries === 0 && isSwappingRef.current) return

      // Determine which quote to use (retry or normal flow)
      const quoteToUse = retryQuote ?? quote

      if (!fromToken || !toToken) {
        throw new Error('Tokens not selected')
      }

      if (!fromAddress || !toAddress) {
        throw new Error('Addresses not specified')
      }

      // Set only after all validations pass so a validation throw can't permanently
      // lock the ref (these throws are outside the try/catch below)
      if (retries === 0) isSwappingRef.current = true
      setSuccessTransferId(undefined)
      setSwapStatus(SwapStatus.Swapping)

      try {
        let gasSettings: GasSettings = {
          estimateGasMarginBps: transferGasMarginBps
        }

        if (isQuickSwapsActive) {
          const suggested: SuggestedGasFees | undefined = networkFees && {
            slow: networkFees.low,
            normal: networkFees.medium,
            fast: networkFees.high
          }
          const tierOverride = mapFeeSettingToGasSettings(feeSetting, suggested)
          if (tierOverride) {
            gasSettings = { ...gasSettings, ...tierOverride }
          } else {
            Logger.warn(
              '[SwapContext] no gas tier override available; using SDK default',
              { feeSetting }
            )
          }
        }

        if (
          isQuickSwapsActive &&
          quoteToUse.serviceType !== ServiceType.MARKR
        ) {
          AnalyticsService.capture('QuickSwapsBypassOpportunityMissed', {
            caip2SourceChainId: quoteToUse.sourceChain.chainId,
            activeServiceType: quoteToUse.serviceType,
            markrQuoteAvailable: allQuotes.some(
              q => q.serviceType === ServiceType.MARKR
            )
          })
        }

        const transfer = await FusionService.transferAsset(
          quoteToUse,
          gasSettings
        )

        if (transfer.status === 'failed') {
          const reason =
            transfer.errorReason ?? transfer.errorCode ?? 'Unknown reason'
          throw new Error(`Transfer failed: ${reason}`)
        }

        isSwappingRef.current = false
        handleSwapSuccess({
          transfer,
          quote: quoteToUse,
          address: fromAddress,
          targetAddress: toAddress,
          fromTokenData: fromToken,
          toTokenData: toToken,
          quoteSelectionMode: userQuote ? 'manual' : 'auto',
          autoRetryAttempt: !userQuote && retries > 0 ? retries : undefined,
          userClickedMax
        })
      } catch (error) {
        // Handle user rejection - silent exit, no error shown
        if (isUserRejectionError(error)) {
          isSwappingRef.current = false
          setSuccessTransferId(undefined)
          setSwapStatus(SwapStatus.Idle)
          return
        }

        Logger.info('[SwapContext] error occurred during swap', error)

        // Auto-retry with next quote (only if using auto mode and under retry limit)
        if (
          !userQuote &&
          retries < maxRetries &&
          allQuotes.length > 1 &&
          shouldRetryWithNextQuote(error)
        ) {
          const nextQuote = findNextQuote(allQuotes, quoteToUse.id)

          if (nextQuote) {
            Logger.error('[SwapContext] retrying with next quote', {
              failed: quoteToUse.aggregator.name,
              failedId: quoteToUse.id,
              retrying: nextQuote.aggregator.name,
              retryingId: nextQuote.id,
              attempt: retries + 1,
              maxRetries,
              errorMessage:
                error instanceof Error ? error.message : String(error)
            })
            showSnackbar('Swap failed, trying next available')
            // Recursive retry — pass the original `quote` through unchanged
            return swap(quote, nextQuote, retries + 1)
          }
        }

        // All retries exhausted or non-retryable error
        isSwappingRef.current = false
        handleSwapError(error)
      }
    },
    [
      fromToken,
      toToken,
      fromAddress,
      toAddress,
      userQuote,
      allQuotes,
      maxRetries,
      transferGasMarginBps,
      isQuickSwapsActive,
      feeSetting,
      networkFees,
      handleSwapSuccess,
      handleSwapError,
      userClickedMax
    ]
  )

  const value: SwapContextState = {
    fromToken,
    setFromToken,
    toToken,
    setToToken,
    bestQuote,
    userQuote,
    activeQuote,
    allQuotes,
    isQuoteLoading,
    quoteError,
    selectQuoteById,
    advanceBestQuote,
    swap,
    slippage,
    setSlippage,
    autoSlippage,
    setAutoSlippage,
    destination,
    setDestination,
    swapStatus,
    amount,
    setAmount,
    userClickedMax,
    setUserClickedMax,
    successTransferId
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
