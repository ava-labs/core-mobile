import SentryWrapper from 'services/sentry/SentryWrapper'
import NftService from 'services/nft/NftService'
import Logger from 'utils/Logger'
import { useCallback } from 'react'
import { NFTItemData } from 'store/nft'
import { useQuery } from '@tanstack/react-query'

export const useNft = ({
  chainId,
  address,
  tokenId,
  staleTime = 0,
  gcTime = 0
}: {
  chainId: number
  address: string
  tokenId: string
  staleTime?: number
  gcTime?: number
}): { nft: NFTItemData | undefined } => {
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
      'nft',
      {
        chainId,
        address,
        tokenId
      }
    ],
    retry: false,
    queryFn: fetchNft,
    staleTime,
    gcTime
  })

  const nft = query.data

  return { nft }
}
