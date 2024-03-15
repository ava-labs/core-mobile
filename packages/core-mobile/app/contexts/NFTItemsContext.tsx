import { NftTokenMetadataStatus } from '@avalabs/glacier-sdk'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import { useNfts } from 'screens/nft/hooks/useNfts'
import NftProcessor from 'services/nft/NftProcessor'
import { getTokenUri, isErc721 } from 'services/nft/utils'
import { NFTImageData, NFTItem, NFTItemData, NFTMetadata } from 'store/nft'
import Logger from 'utils/Logger'

type NFTItemsContextState = {
  process: (nfts: NFTItemData[]) => void
  nftItems: NFTItem[]
  getNftItem: (uid: string) => NFTItem | undefined
  setNftVisited: (visited: boolean) => void
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  refetch: () => void
  isRefetching: boolean
  isLoading: boolean
}

export const NFTItemsContext = createContext<NFTItemsContextState>(
  {} as NFTItemsContextState
)

export const NFTMetadataProvider = ({
  children
}: {
  children: React.ReactNode
}): JSX.Element => {
  const [metadata, setMetadata] = useState<Record<string, NFTMetadata>>({})
  const [imageData, setImageData] = useState<Record<string, NFTImageData>>({})
  const [nftVisited, setNftVisited] = useState<boolean>(false)

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

  const process = useCallback(
    (items: NFTItemData[]): void => {
      processMetadata(items)
      processImageData(items)
    },
    [processImageData, processMetadata]
  )

  const query = useNfts(nftVisited)

  useEffect(() => {
    const lastPageNfts = query.data?.pages.at(-1)?.nfts ?? []

    if (lastPageNfts.length > 0) {
      process(lastPageNfts)
    }
  }, [query.data, process])

  const nftItems = useMemo(
    () =>
      query.nfts.map(nft => ({
        ...nft,
        imageData: imageData[nft.uid],
        processedMetadata: metadata[nft.uid] ?? {
          ...nft.metadata,
          attributes: []
        }
      })),
    [query.nfts, imageData, metadata]
  )

  const getNftItem = useCallback(
    (uid: string): NFTItem | undefined => {
      return nftItems.find(nft => nft.uid === uid)
    },
    [nftItems]
  )

  return (
    <NFTItemsContext.Provider
      value={{
        process,
        nftItems,
        getNftItem,
        setNftVisited,
        ...query
      }}>
      {children}
    </NFTItemsContext.Provider>
  )
}

export function useNftItemsContext(): NFTItemsContextState {
  return useContext(NFTItemsContext)
}
