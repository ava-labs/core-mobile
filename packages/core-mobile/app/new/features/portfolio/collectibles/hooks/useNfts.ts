import { ChainId, Network } from '@avalabs/core-chains-sdk'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useRefreshableQuery } from 'hooks/query/useRefreshableQuery'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import NftService from 'services/nft/NftService'
import { UnprocessedNftItem } from 'services/nft/types'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { selectActiveAccount } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectSelectedCurrency } from 'store/settings/currency'
import Logger from 'utils/Logger'

const REFETCH_INTERVAL = 30000 // 30 seconds

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useNfts = (enabled: boolean) => {
  const { allNetworks } = useNetworks()

  const currency = useSelector(selectSelectedCurrency).toLowerCase()
  const activeAccount = useSelector(selectActiveAccount)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const fetchNfts = useCallback(async () => {
    if (!activeAccount?.addressC) {
      throw new Error('unable to get NFTs')
    }

    return SentryWrapper.startSpan({ name: 'get-nfts' }, async () => {
      try {
        const networks = isDeveloperMode
          ? [
              allNetworks[ChainId.AVALANCHE_TESTNET_ID],
              allNetworks[ChainId.ETHEREUM_TEST_GOERLY]
            ]
          : [
              allNetworks[ChainId.AVALANCHE_MAINNET_ID],
              allNetworks[ChainId.ETHEREUM_HOMESTEAD]
            ]

        const results = await Promise.allSettled(
          networks?.map(network =>
            NftService.fetchNfts({
              network: network as Network,
              address: activeAccount?.addressC,
              currency
            })
          )
        )

        return results
          ?.filter(result => result.status === 'fulfilled' && result.value)
          .map(
            result =>
              (result as PromiseFulfilledResult<UnprocessedNftItem[]>).value
          )
          .flatMap(nfts => nfts)
      } catch (err) {
        Logger.error(`Failed to get NFTs for chains`, err)
        return []
      }
    })
  }, [activeAccount?.addressC, allNetworks, currency, isDeveloperMode])

  return useRefreshableQuery({
    queryKey: [ReactQueryKeys.NFTS, activeAccount?.addressC || '', currency],
    enabled,
    queryFn: fetchNfts,
    refetchInterval: REFETCH_INTERVAL
  })
}
