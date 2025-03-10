import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { useQuery } from '@tanstack/react-query'
import SentryWrapper from 'services/sentry/SentryWrapper'
import NftService from 'services/nft/NftService'
import Logger from 'utils/Logger'
import { useCallback } from 'react'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useNetworks } from 'hooks/networks/useNetworks'
import { selectSelectedCurrency } from 'store/settings/currency'

const REFETCH_INTERVAL = 30000 // 30 seconds

// a hook to get NFTs for the current active network & account
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useNfts = (enabled: boolean) => {
  const { activeNetwork } = useNetworks()
  const currency = useSelector(selectSelectedCurrency).toLowerCase()
  const account = useSelector(selectActiveAccount)

  const fetchNfts = useCallback(async () => {
    if (!account?.addressC) {
      throw new Error('unable to get NFTs')
    }

    return SentryWrapper.startSpan({ name: 'get-nfts' }, async () => {
      try {
        return await NftService.fetchNfts({
          network: activeNetwork,
          address: account.addressC,
          currency
        })
      } catch (err) {
        Logger.error(
          `Failed to get NFTs for chain ${activeNetwork.chainId}`,
          err
        )
        return []
      }
    })
  }, [account, activeNetwork, currency])

  return useQuery({
    queryKey: [
      ReactQueryKeys.NFTS,
      activeNetwork.chainId,
      account?.addressC,
      currency
    ],
    enabled,
    queryFn: fetchNfts,
    refetchInterval: REFETCH_INTERVAL
  })
}
