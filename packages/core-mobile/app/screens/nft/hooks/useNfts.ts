import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import { selectActiveAccount } from 'store/account'
import { useInfiniteQuery } from '@tanstack/react-query'
import SentryWrapper from 'services/sentry/SentryWrapper'
import NftService from 'services/nft/NftService'
import Logger from 'utils/Logger'
import { useCallback, useEffect, useMemo } from 'react'
import { useNftMetadataContext } from 'contexts/NFTMetadataContext'
import { NftPageParam } from '../../../store/nft/types'

// a hook to get NFTs with pagination support for the current active network & account
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useNfts = () => {
  const network = useSelector(selectActiveNetwork)
  const account = useSelector(selectActiveAccount)
  const { process } = useNftMetadataContext()

  const fetchNfts = useCallback(
    async ({ pageParam }: { pageParam: NftPageParam }) => {
      if (!account?.address) {
        throw new Error('unable to get NFTs')
      }

      const t = SentryWrapper.startTransaction('get-nfts')
      try {
        const nftPagedData = await NftService.fetchNfts({
          chainId: network.chainId,
          address: account.address,
          pageToken: pageParam
        })

        return {
          nfts: nftPagedData.nfts,
          nextPageToken: nftPagedData.nextPageToken
        }
      } catch (err) {
        Logger.error(`failed to get nfts for chain ${network.chainId}`, err)
        return { nfts: [], nextPageToken: undefined }
      } finally {
        SentryWrapper.finish(t)
      }
    },
    [account, network]
  )

  const query = useInfiniteQuery({
    queryKey: [
      'nfts',
      {
        chainId: network.chainId,
        accountAddress: account?.address
      }
    ],
    retry: false,
    queryFn: fetchNfts,
    initialPageParam: {},
    getNextPageParam: (lastPage, _) => {
      // glacier api is returning nextPageToken as empty string when there is no more data
      // so when nextPageToken is falsy, we should return undefined
      return lastPage.nextPageToken ? lastPage.nextPageToken : undefined
    }
  })

  const nfts = useMemo(() => {
    const flattenedNfts = query.data?.pages.flatMap(page => page.nfts) ?? []
    return Array.from(
      new Map(flattenedNfts.map(nft => [nft.uid, nft])).values()
    )
  }, [query.data?.pages])

  useEffect(() => {
    process(nfts)
  }, [nfts, process])

  return {
    ...query,
    nfts
  }
}
