import { useEffect, useState } from 'react'
import NftProcessor, { NftProcessorEvent } from 'services/nft/NftProcessor'
import { NFTItemData, NFTMetadata } from '../../../store/nft/types'

export const useGetNftMetadata = (): {
  getNftMetadata: (nft: NFTItemData) => NFTMetadata
} => {
  const [metadata, setMetadata] = useState<Record<string, NFTMetadata>>(
    NftProcessor.metadata
  )

  const updateMetadata = ({
    nftUID,
    data
  }: {
    nftUID: string
    data: NFTMetadata
  }): void => {
    setMetadata(prevData => ({
      ...prevData,
      [nftUID]: data
    }))
  }

  const getNftMetadata = (nft: NFTItemData): NFTMetadata => {
    return (
      metadata[nft.uid] ?? {
        ...nft.metadata,
        attributes: []
      }
    )
  }

  useEffect(() => {
    NftProcessor.addListener(
      NftProcessorEvent.MetadataProcessed,
      updateMetadata
    )

    return () => {
      NftProcessor.removeListener(
        NftProcessorEvent.MetadataProcessed,
        updateMetadata
      )
    }
  }, [])

  return {
    getNftMetadata
  }
}
