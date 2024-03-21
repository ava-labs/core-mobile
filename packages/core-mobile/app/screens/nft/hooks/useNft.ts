import SentryWrapper from 'services/sentry/SentryWrapper'
import NftService from 'services/nft/NftService'
import Logger from 'utils/Logger'
import { useCallback } from 'react'
import { NFTItemData } from 'store/nft'
import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'

export const useNft = ({
  chainId,
  address,
  tokenId,
  refetchInterval,
  staleTime = 0,
  gcTime = 0
}: {
  chainId: number
  address: string
  tokenId: string
  refetchInterval?: number
  staleTime?: number
  gcTime?: number
}): { nft: NFTItemData | undefined; nftUpdatedAt: number } => {
  const fetchNft = useCallback(async () => {
    const t = SentryWrapper.startTransaction('get-nft')
    try {
      return await NftService.fetchNft({
        chainId: chainId,
        address: address,
        tokenId: tokenId
      })
    } catch (err) {
      Logger.error(`failed to get nfts for chain ${chainId}`, err)
      return undefined
    } finally {
      SentryWrapper.finish(t)
    }
  }, [chainId, address, tokenId])

  const query = useQuery({
    queryKey: [
      ReactQueryKeys.NFT,
      {
        chainId,
        address,
        tokenId
      }
    ],
    retry: false,
    queryFn: fetchNft,
    refetchInterval: refetchInterval,
    staleTime,
    gcTime
  })

  return { nft: query.data, nftUpdatedAt: query.dataUpdatedAt }
}
