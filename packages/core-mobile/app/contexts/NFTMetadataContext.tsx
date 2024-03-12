import { NftTokenMetadataStatus } from '@avalabs/glacier-sdk'
import React, { createContext, useCallback, useContext, useState } from 'react'
import NftProcessor from 'services/nft/NftProcessor'
import { getTokenUri, isErc721 } from 'services/nft/utils'
import { NFTImageData, NFTItemData, NFTMetadata } from 'store/nft'
import Logger from 'utils/Logger'

type NFTMetadataContextState = {
  getNftImageData: (nft: NFTItemData) => NFTImageData | undefined
  getNftMetadata: (nft: NFTItemData) => NFTMetadata
  process: (nfts: NFTItemData[]) => void
}

export const NFTMetadataContext = createContext<NFTMetadataContextState>(
  {} as NFTMetadataContextState
)

export const NFTMetadataProvider = ({
  children
}: {
  children: React.ReactNode
}): JSX.Element => {
  const [metadata, setMetadata] = useState<Record<string, NFTMetadata>>({})
  const [imageData, setImageData] = useState<Record<string, NFTImageData>>({})

  const processImageData = useCallback((items: NFTItemData[]): void => {
    items.forEach(nft => {
      if (nft.metadata.imageUri) {
        NftProcessor.fetchImageAndAspect(nft.metadata.imageUri)
          .then(result => {
            setImageData(prevData => ({
              ...prevData,
              [nft.uid]: result
            }))
          })
          .catch(Logger.error)
      }
    })
  }, [])

  const processUnindexedNftMetadata = useCallback(
    (nft: NFTItemData): void => {
      NftProcessor.fetchMetadata(getTokenUri(nft))
        .then(result => {
          const updatedNft: NFTItemData = {
            ...nft,
            metadata: {
              ...nft.metadata,
              externalUrl: result.external_url ?? '',
              name: result.name ?? '',
              imageUri: result.image ?? '',
              description: result.description ?? '',
              animationUri: result.animation_url ?? ''
            }
          }

          if (updatedNft.metadata.imageUri) {
            processImageData([updatedNft])
          }

          const newMetadata: NFTMetadata = {
            ...updatedNft.metadata,
            attributes: result.attributes ?? []
          }

          setMetadata(prevData => ({
            ...prevData,
            [nft.uid]: newMetadata
          }))
        })
        .catch(Logger.error)
    },
    [processImageData]
  )

  const processIndexedNftMetadata = useCallback((nft: NFTItemData): void => {
    let newMetadata: NFTMetadata
    try {
      newMetadata = {
        ...nft.metadata,
        attributes:
          JSON.parse(
            (isErc721(nft)
              ? nft.metadata.attributes
              : nft.metadata.properties) || ''
          ) ?? []
      }
    } catch (e) {
      newMetadata = {
        ...nft.metadata,
        attributes: []
      }
    }

    setMetadata(prevData => ({
      ...prevData,
      [nft.uid]: newMetadata
    }))
  }, [])

  const processMetadata = useCallback(
    (items: NFTItemData[]): void => {
      items.forEach(nft => {
        if (nft.metadata.indexStatus === NftTokenMetadataStatus.INDEXED) {
          processIndexedNftMetadata(nft)
        } else {
          processUnindexedNftMetadata(nft)
        }
      })
    },
    [processUnindexedNftMetadata, processIndexedNftMetadata]
  )

  const getNftMetadata = useCallback(
    (nft: NFTItemData): NFTMetadata => {
      return (
        metadata[nft.uid] ?? {
          ...nft.metadata,
          attributes: []
        }
      )
    },
    [metadata]
  )

  const getNftImageData = useCallback(
    (nft: NFTItemData): NFTImageData | undefined => {
      return imageData[nft.uid]
    },
    [imageData]
  )

  const process = useCallback(
    (items: NFTItemData[]): void => {
      processMetadata(items)
      processImageData(items)
    },
    [processImageData, processMetadata]
  )

  return (
    <NFTMetadataContext.Provider
      value={{
        getNftImageData,
        getNftMetadata,
        process
      }}>
      {children}
    </NFTMetadataContext.Provider>
  )
}

export function useNftMetadataContext(): NFTMetadataContextState {
  return useContext(NFTMetadataContext)
}
