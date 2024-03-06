import { useEffect, useState } from 'react'
import NftProcessor, { NftProcessorEvent } from 'services/nft/NftProcessor'
import {
  NFTItemData,
  NFTImageData,
  NFTMetadata
} from '../../../store/nft/types'

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

export const useGetNftImageData = (): {
  getNftImageData: (nft: NFTItemData) => NFTImageData | undefined
} => {
  const [imageData, setImageData] = useState<Record<string, NFTImageData>>(
    NftProcessor.imageData
  )

  const updateImageData = ({
    nftUID,
    data
  }: {
    nftUID: string
    data: NFTImageData
  }): void => {
    setImageData(prevData => ({
      ...prevData,
      [nftUID]: data
    }))
  }

  const getNftImageData = (nft: NFTItemData): NFTImageData | undefined => {
    return imageData[nft.uid]
  }

  useEffect(() => {
    NftProcessor.addListener(
      NftProcessorEvent.ImageDataProcessed,
      updateImageData
    )

    return () => {
      NftProcessor.removeListener(
        NftProcessorEvent.ImageDataProcessed,
        updateImageData
      )
    }
  }, [])

  return {
    getNftImageData
  }
}
