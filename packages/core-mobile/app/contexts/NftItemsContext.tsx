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
import GlacierNftProvider from 'services/nft/GlacierNftProvider'
import NftProcessor from 'services/nft/NftProcessor'
import {
  NftImageData,
  UnprocessedNftItem,
  NftItemExternalData,
  NftLocalId,
  NftItem
} from 'services/nft/types'
import { getTokenUri, sortNftsByDateUpdated } from 'services/nft/utils'
import { selectHiddenNftLocalIds } from 'store/nft/slice'
import { isPositiveNumber } from 'utils/isPositiveNumber/isPositiveNumber'
import Logger from 'utils/Logger'

type NftItemsContextState = {
  nftItems: NftItem[]
  filteredNftItems: NftItem[]
  getNftItem: (localId: NftLocalId) => NftItem | undefined
  refreshNftMetadata: (nftData: NftItem, chainId: number) => Promise<void>
  isNftRefreshing: (uid: string) => boolean
  refetchNfts: () => void
  isNftsRefetching: boolean
  isNftsLoading: boolean
  setNftsLoadEnabled: React.Dispatch<React.SetStateAction<boolean>>
}

export const NftItemsContext = createContext<NftItemsContextState>(
  {} as NftItemsContextState
)

export const NftMetadataProvider = ({
  children
}: {
  children: React.ReactNode
}): JSX.Element => {
  const [lastUpdatedTimestamp, setLastUpdatedTimestamp] = useState<
    Record<NftLocalId, number>
  >({})
  const [processedMetadata, setProcessedMetadata] = useState<
    Record<NftLocalId, NftItemExternalData>
  >({})
  const [imageData, setImageData] = useState<Record<NftLocalId, NftImageData>>(
    {}
  )
  const [isRefreshing, setIsRefreshing] = useState<Record<NftLocalId, boolean>>(
    {}
  )
  const [nftsLoadEnabled, setNftsLoadEnabled] = useState<boolean>(false)
  const hiddenNfts = useSelector(selectHiddenNftLocalIds)

  const processImageData = useCallback(
    (localId: NftLocalId, logoUri: string): void => {
      logoUri &&
        NftProcessor.fetchImageAndAspect(logoUri)
          .then(result => {
            setImageData(prevData => ({
              ...prevData,
              [localId]: result
            }))
          })
          .catch(e => {
            Logger.error(e)
          })
    },
    []
  )
  const processMetadata = useCallback(
    ({
      localId,
      tokenId,
      tokenUri
    }: {
      localId: string
      tokenId: string
      tokenUri: string
    }): void => {
      tokenUri &&
        NftProcessor.fetchMetadata(getTokenUri({ tokenId, tokenUri }))
          .then(result => {
            processImageData(localId, result.image)

            setProcessedMetadata(prevData => ({
              ...prevData,
              [localId]: result
            }))
          })
          .catch(e => {
            Logger.error(e)
          })
    },
    [processImageData]
  )

  const process = useCallback(
    (items: UnprocessedNftItem[]): void => {
      for (const item of items) {
        // if logoUri is present, no need to fetch metadata
        if (!item.logoUri) {
          processMetadata({
            localId: item.localId,
            tokenId: item.tokenId,
            tokenUri: item.tokenUri
          })
        }
        processImageData(item.localId, item.logoUri)
      }
    },
    [processMetadata, processImageData]
  )

  const query = useNfts(nftsLoadEnabled)

  const nftItems: NftItem[] = useMemo(() => {
    return (
      query.data?.map(nft => {
        return {
          ...nft,
          metadata: {
            ...nft.metadata,
            lastUpdatedTimestamp:
              nft.metadata?.lastUpdatedTimestamp ||
              lastUpdatedTimestamp[nft.localId]
          },
          imageData: imageData[nft.localId],
          processedMetadata: processedMetadata[nft.localId]
        }
      }) ?? []
    )
  }, [query.data, lastUpdatedTimestamp, imageData, processedMetadata])

  const getNftItem = useCallback(
    (localId: NftLocalId): NftItem | undefined => {
      return nftItems.find(nft => nft.localId === localId)
    },
    [nftItems]
  )

  const refreshNftMetadata = async (
    nft: NftItem,
    chainId: number
  ): Promise<void> => {
    setIsRefreshing(prevData => ({
      ...prevData,
      [nft.localId]: true
    }))

    try {
      const newMetadata = await GlacierNftProvider.reindexNft(
        nft.address,
        chainId,
        nft.tokenId
      )

      newMetadata.imageUri &&
        processImageData(nft.localId, newMetadata.imageUri)

      const updatedTimestamp = newMetadata.metadataLastUpdatedTimestamp

      if (isPositiveNumber(updatedTimestamp)) {
        setLastUpdatedTimestamp(prevData => ({
          ...prevData,
          [nft.localId]: updatedTimestamp
        }))
      }

      setProcessedMetadata(prevData => {
        const existingMetaData = prevData[nft.localId]

        if (!existingMetaData) return prevData

        return {
          ...prevData,
          [nft.localId]: {
            ...existingMetaData,
            ...(newMetadata.description && {
              description: newMetadata.description
            }),
            ...(newMetadata.name && { name: newMetadata.name }),
            ...(newMetadata.imageUri && { image: newMetadata.imageUri }),
            ...(newMetadata.externalUrl && {
              external_url: newMetadata.externalUrl
            }),
            ...(newMetadata.animationUri && {
              animation_url: newMetadata.animationUri
            })
          }
        }
      })

      ShowSnackBar(<SnackBarMessage message="NFT refreshed successfully" />)
    } catch (e) {
      Logger.error('Failed to refresh nft', e)
      showSimpleToast(
        'This is taking longer than expected. Please try again later.'
      )
    } finally {
      setIsRefreshing(prevData => ({
        ...prevData,
        [nft.localId]: false
      }))
    }
  }

  const isNftRefreshing = useCallback(
    (localId: NftLocalId) => {
      return isRefreshing[localId] === true
    },
    [isRefreshing]
  )

  const filteredNftItems = useMemo(() => {
    return nftItems
      .filter(value => {
        return !hiddenNfts[value.localId]
      })
      .sort(sortNftsByDateUpdated)
  }, [hiddenNfts, nftItems])

  useEffect(() => {
    if (query.data !== undefined) {
      process(query.data)
    }
  }, [query.data, process])

  return (
    <NftItemsContext.Provider
      value={{
        nftItems,
        filteredNftItems,
        getNftItem,
        refreshNftMetadata,
        isNftRefreshing,
        refetchNfts: query.refetch,
        isNftsRefetching: query.isRefetching,
        isNftsLoading: query.isLoading,
        setNftsLoadEnabled
      }}>
      {children}
    </NftItemsContext.Provider>
  )
}

export function useNftItemsContext(): NftItemsContextState {
  return useContext(NftItemsContext)
}
