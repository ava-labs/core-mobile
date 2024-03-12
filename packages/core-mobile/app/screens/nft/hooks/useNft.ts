import SentryWrapper from 'services/sentry/SentryWrapper'
import NftService from 'services/nft/NftService'
import Logger from 'utils/Logger'
import { useCallback, useEffect } from 'react'
import { NFTItemData } from 'store/nft'
import { useQuery } from '@tanstack/react-query'
import { useNftMetadataContext } from 'contexts/NFTMetadataContext'

export const useNft = (
  chainId: number,
  address: string,
  tokenId: string
): { nft: NFTItemData | undefined } => {
  const { process } = useNftMetadataContext()

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
        chainId: chainId,
        address: address,
        tokenId
      }
    ],
    retry: false,
    queryFn: fetchNft
  })

  const nft = query.data

  useEffect(() => {
    if (nft) {
      process([nft])
    }
  }, [nft, process])

  return { nft }
}
