import {
  type QueryObserverResult,
  type RefetchOptions,
  skipToken,
  useQuery
} from '@tanstack/react-query'
import { readContract } from 'viem/actions'
import { DefiMarket, MarketNames } from 'features/deposit/types'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { Address } from 'viem'
import { BENQI_COMPTROLLER } from 'features/deposit/abis/benqiComptroller'
import { BENQI_COMPTROLLER_C_CHAIN_ADDRESS } from 'features/deposit/consts'
import Logger from 'utils/Logger'
import { getBenqiDepositedBalance } from 'features/deposit/utils/getBenqiDepositedBalance'
import { getBenqiSupplyApyPercent } from 'features/deposit/utils/getBenqiLiveApy'
import { getBenqiUnderlyingTokenDetails } from 'features/deposit/utils/getBenqiUnderlyingTokenDetails'
import { getBenqiUnderlyingTotalSupply } from 'features/deposit//utils/getBenqiUnderlyingTotalSupply'
import { getUniqueMarketId } from 'features/deposit/utils/getUniqueMarketId'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { findMatchingTokenWithBalance } from 'features/deposit/utils/findMatchingTokenWithBalance'
import { useCChainClient } from '../useCChainClient'
import { useGetCChainToken } from '../useGetCChainToken'
import { useCChainTokensWithBalance } from '../useCChainTokensWithBalance'

export const useBenqiAvailableMarkets = (): {
  data: DefiMarket[] | undefined
  error: Error | null
  isLoading: boolean
  isPending: boolean
  isFetching: boolean
  refetch:
    | ((
        options?: RefetchOptions
      ) => Promise<QueryObserverResult<DefiMarket[], Error>>)
    | (() => void)
} => {
  const cChainNetwork = useCChainNetwork()
  const cChainClient = useCChainClient()
  const activeAccount = useSelector(selectActiveAccount)
  const addressEVM = activeAccount?.addressC
  const { tokens } = useCChainTokensWithBalance()
  const getCChainToken = useGetCChainToken()

  const {
    data: enrichedMarkets,
    isLoading: isLoadingEnrichedMarkets,
    isPending: isPendingEnrichedMarkets,
    isFetching: isFetchingEnrichedMarkets,
    error: errorEnrichedMarkets,
    refetch
  } = useQuery({
    queryKey: ['useBenqiAvailableMarkets', cChainClient, cChainNetwork, tokens],
    queryFn:
      cChainClient && cChainNetwork
        ? async () => {
            const qTokenAddresses = (await readContract(cChainClient, {
              address: BENQI_COMPTROLLER_C_CHAIN_ADDRESS,
              abi: BENQI_COMPTROLLER,
              functionName: 'getAllMarkets',
              args: []
            })) as Address[]

            const results = await Promise.allSettled(
              qTokenAddresses.map(async qTokenAddress => {
                try {
                  const isPaused = await readContract(cChainClient, {
                    address: BENQI_COMPTROLLER_C_CHAIN_ADDRESS,
                    abi: BENQI_COMPTROLLER,
                    functionName: 'mintGuardianPaused',
                    args: [qTokenAddress]
                  })

                  // We don't currently show paused markets
                  if (isPaused) {
                    return undefined
                  }

                  const {
                    underlyingTokenAddress,
                    underlyingTokenName,
                    underlyingTokenDecimals,
                    underlyingTokenSymbol
                  } = await getBenqiUnderlyingTokenDetails({
                    cChainClient,
                    qTokenAddress
                  })

                  const underlyingTotalSupply =
                    await getBenqiUnderlyingTotalSupply({
                      cChainClient,
                      qTokenAddress,
                      underlyingTokenDecimals
                    })

                  const supplyApyPercent = await getBenqiSupplyApyPercent({
                    qTokenAddress,
                    underlyingTokenDecimals,
                    underlyingTotalSupply,
                    cChainClient
                  })

                  const balance = findMatchingTokenWithBalance(
                    {
                      symbol: underlyingTokenSymbol,
                      contractAddress: underlyingTokenAddress
                    },
                    tokens
                  )

                  const token = getCChainToken(
                    underlyingTokenSymbol,
                    underlyingTokenAddress
                  )

                  const marketData = {
                    marketName: MarketNames.benqi,
                    network: cChainNetwork,
                    asset: {
                      mintTokenAddress: qTokenAddress,
                      assetName: underlyingTokenName,
                      decimals: underlyingTokenDecimals,
                      iconUrl: token?.logoUri,
                      symbol: underlyingTokenSymbol,
                      contractAddress: underlyingTokenAddress,
                      underlyingTokenBalance: balance,
                      mintTokenBalance: await getBenqiDepositedBalance({
                        cChainClient,
                        underlyingTokenDecimals,
                        walletAddress: addressEVM as Address,
                        qTokenAddress
                      })
                    },
                    type: 'lending' as const,
                    supplyApyPercent,
                    historicalApyPercent: undefined,
                    totalDeposits: underlyingTotalSupply,
                    // There currently are no supply caps on Benqi markets we support.
                    supplyCapReached: false
                  }

                  return {
                    ...marketData,
                    uniqueMarketId: getUniqueMarketId(marketData)
                  }
                } catch (err) {
                  Logger.error('Error fetching/enriching Benqi market', {
                    qTokenAddress,
                    err
                  })
                  return undefined
                }
              })
            )

            return results
              .filter(promise => promise.status === 'fulfilled')
              .map(promise => promise.value)
              .filter(market => !!market)
          }
        : skipToken
  })

  return {
    data: enrichedMarkets,
    error: errorEnrichedMarkets ?? null,
    isLoading: isLoadingEnrichedMarkets,
    isPending: isPendingEnrichedMarkets,
    isFetching: isFetchingEnrichedMarkets,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    refetch: cChainClient ? refetch : () => {}
  }
}
