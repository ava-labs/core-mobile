import { NftTokenMetadataStatus } from '@avalabs/glacier-sdk'
import React, { createContext, useCallback, useContext, useState } from 'react'
import NftProcessor from 'services/nft/NftProcessor'
import { getTokenUri, isErc721 } from 'services/nft/utils'
import { NFTImageData, NFTItemData, NFTMetadata } from 'store/nft'
import Logger from 'utils/Logger'

type NFTMetadataContextState = {
  getNftImageData: (nft: NFTItemData) => NFTImageData | undefined
  getNftMetadata: (nft: NFTItemData) => NFTMetadata
  process: (nfts: NFTItemData[], shouldUpdate?: boolean) => void
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

  const processImageData = useCallback(
    (items: NFTItemData[], shouldUpdate: boolean): void => {
      items.forEach(nft => {
        if (imageData[nft.uid] && shouldUpdate !== true) {
          return
        }

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
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const processUnindexedNftMetadata = useCallback(
    (nft: NFTItemData, shouldUpdate: boolean): void => {
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
            processImageData([updatedNft], shouldUpdate)
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
    (items: NFTItemData[], shouldUpdate: boolean): void => {
      items.forEach(nft => {
        if (metadata[nft.uid] && shouldUpdate !== true) {
          return
        }

        if (nft.metadata.indexStatus === NftTokenMetadataStatus.INDEXED) {
          processIndexedNftMetadata(nft)
        } else {
          processUnindexedNftMetadata(nft, shouldUpdate)
        }
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    (items: NFTItemData[], shouldUpdate = false): void => {
      processMetadata(items, shouldUpdate)
      processImageData(items, shouldUpdate)
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
