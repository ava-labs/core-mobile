import { useEffect, useState } from 'react'
import NftProcessor, { NftProcessorEvent } from 'services/nft/NftProcessor'
import { NFTItemData, NFTImageData } from '../../../store/nft/types'

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
