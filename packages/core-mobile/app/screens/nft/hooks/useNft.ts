import SentryWrapper from 'services/sentry/SentryWrapper'
import NftService from 'services/nft/NftService'
import Logger from 'utils/Logger'
import { useCallback, useEffect } from 'react'
import NftProcessor from 'services/nft/NftProcessor'
import { NFTItemData } from 'store/nft'
import { useQuery } from '@tanstack/react-query'

export const useNft = (
  chainId: number,
  address: string,
  tokenId: string
): { nft: NFTItemData | undefined } => {
  const fetchNft = useCallback(async () => {
    const t = SentryWrapper.startTransaction('get-nfts')
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
      NftProcessor.process([nft], true)
    }
  }, [nft])

  return { nft }
}
