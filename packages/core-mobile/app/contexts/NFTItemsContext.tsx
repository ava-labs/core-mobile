import { NftTokenMetadataStatus } from '@avalabs/glacier-sdk'
import { ShowSnackBar, showSimpleToast } from 'components/Snackbar'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import { useSelector } from 'react-redux'
import { useNfts } from 'screens/nft/hooks/useNfts'
import { SnackBarMessage } from 'seedless/components/SnackBarMessage'
import NftProcessor from 'services/nft/NftProcessor'
import NftService from 'services/nft/NftService'
import { getTokenUri, isErc721 } from 'services/nft/utils'
import {
  NFTImageData,
  NFTItem,
  NFTItemData,
  NFTMetadata,
  selectHiddenNftUIDs
} from 'store/nft'
import Logger from 'utils/Logger'

type NFTItemsContextState = {
  nftItems: NFTItem[]
  filteredNftItems: NFTItem[]
  getNftItem: (uid: string) => NFTItem | undefined
  refreshNftMetadata: (nftData: NFTItemData, chainId: number) => Promise<void>
  isNftRefreshing: (uid: string) => boolean
  checkIfNftRefreshed: (nftData: NFTItemData) => void
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  refetchNfts: () => void
  isNftsRefetching: boolean
  isNftsLoading: boolean
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
  const [reindexedAt, setReindexedAt] = useState<Record<string, number>>({})
  const hiddenNfts = useSelector(selectHiddenNftUIDs)

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

  const query = useNfts()

  const nftItems = useMemo(() => {
    return query.nfts.map(nft => ({
      ...nft,
      imageData: imageData[nft.uid],
      processedMetadata: metadata[nft.uid] ?? {
        ...nft.metadata,
        attributes: []
      }
    }))
  }, [query.nfts, imageData, metadata])

  const getNftItem = useCallback(
    (uid: string): NFTItem | undefined => {
      return nftItems.find(nft => nft.uid === uid)
    },
    [nftItems]
  )

  const refreshNftMetadata = async (
    nftData: NFTItemData,
    chainId: number
  ): Promise<void> => {
    await NftService.reindexNft(nftData.address, chainId, nftData.tokenId)

    setReindexedAt(prevData => ({
      ...prevData,
      [nftData.uid]: Math.floor(Date.now() / 1000)
    }))
  }

  const isNftRefreshing = useCallback(
    (uid: string) => {
      return reindexedAt[uid] !== undefined
    },
    [reindexedAt]
  )

  const checkIfNftRefreshed = useCallback(
    (nftData: NFTItemData) => {
      const nftReindexedAt = reindexedAt[nftData.uid]
      if (!nftReindexedAt) {
        // If the NFT was not requested to be refreshed, it might have been failed
        // due to an error. We process it to check if it has been indexed.
        process([nftData])
        return
      }

      const currentTimestamp = Math.floor(Date.now() / 1000)
      const metadataUpdatedAt = nftData?.metadata.metadataLastUpdatedTimestamp
      if (
        metadataUpdatedAt !== undefined &&
        metadataUpdatedAt > nftReindexedAt
      ) {
        setReindexedAt(prevData => {
          const newReindexedAt = { ...prevData }
          delete newReindexedAt[nftData.uid]
          return newReindexedAt
        })

        process([nftData])

        ShowSnackBar(<SnackBarMessage message="NFT refreshed successfully" />)
      } else if (nftReindexedAt < currentTimestamp - 20) {
        // If the metadata was not updated after 20 seconds, we assume the
        // reindexing failed and remove the refresh request.
        setReindexedAt(prevData => {
          const newReindexedAt = { ...prevData }
          delete newReindexedAt[nftData.uid]
          return newReindexedAt
        })

        showSimpleToast(
          'This is taking longer than expected. Please try again later.'
        )
      }
    },
    [reindexedAt, process]
  )

  const filteredNftItems = useMemo(() => {
    return nftItems.filter(value => !hiddenNfts[value.uid])
  }, [hiddenNfts, nftItems])

  useEffect(() => {
    if (query.data && query.data.pages.length > 0) {
      // It runs every time new data is fetched by useInfiniteQuery, specifically
      // when a new page is added, to ensure the newly fetched NFTs are processed.
      const lastPageIndex = query.data.pages.length - 1

      const lastPageNfts = query.data.pages[lastPageIndex]?.nfts ?? []
      if (lastPageNfts.length > 0) {
        process(lastPageNfts)
      }
    }
  }, [query.data, process])

  return (
    <NFTItemsContext.Provider
      value={{
        nftItems,
        filteredNftItems,
        getNftItem,
        refreshNftMetadata,
        isNftRefreshing,
        checkIfNftRefreshed,
        fetchNextPage: query.fetchNextPage,
        hasNextPage: query.hasNextPage,
        isFetchingNextPage: query.isFetchingNextPage,
        refetchNfts: query.refetch,
        isNftsRefetching: query.isRefetching,
        isNftsLoading: query.isLoading
      }}>
      {children}
    </NFTItemsContext.Provider>
  )
}

export function useNftItemsContext(): NFTItemsContextState {
  return useContext(NFTItemsContext)
}
