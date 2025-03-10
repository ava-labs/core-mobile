import { showSnackbar } from 'common/utils/toast'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import GlacierNftProvider from 'services/nft/GlacierNftProvider'
import NftProcessor from 'services/nft/NftProcessor'
import {
  NftImageData,
  NftItem,
  NftItemExternalData,
  NftLocalId,
  UnprocessedNftItem
} from 'services/nft/types'
import { getTokenUri } from 'services/nft/utils'
import { isPositiveNumber } from 'utils/isPositiveNumber/isPositiveNumber'
import Logger from 'utils/Logger'
import { useNfts } from './hooks/useNfts'

type CollectiblesContextState = {
  collectibles: NftItem[]
  isLoading: boolean
  isEnabled: boolean
  isRefetching: boolean
  getCollectible: (localId: NftLocalId) => NftItem | undefined
  refreshMetadata: (nftData: NftItem, chainId: number) => Promise<void>
  isCollectibleRefreshing: (uid: string) => boolean
  refetch: () => void
  setIsEnabled: React.Dispatch<React.SetStateAction<boolean>>
}

export const CollectiblesContext = createContext<CollectiblesContextState>(
  {} as CollectiblesContextState
)

export const CollectiblesProvider = ({
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
  const [isEnabled, setIsEnabled] = useState<boolean>(false)

  const query = useNfts(isEnabled)

  const collectibles: NftItem[] = useMemo(() => {
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

  const getCollectible = useCallback(
    (localId: NftLocalId): NftItem | undefined => {
      return collectibles.find(nft => nft.localId === localId)
    },
    [collectibles]
  )

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

  const refreshMetadata = async (
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

      showSnackbar('NFT refreshed successfully')
    } catch (e) {
      Logger.error('Failed to refresh nft', e)
      showSnackbar(
        'This is taking longer than expected. Please try again later.'
      )
    } finally {
      setIsRefreshing(prevData => ({
        ...prevData,
        [nft.localId]: false
      }))
    }
  }

  const isCollectibleRefreshing = useCallback(
    (localId: NftLocalId) => {
      return isRefreshing[localId] === true
    },
    [isRefreshing]
  )

  useEffect(() => {
    if (query.data !== undefined) {
      process(query.data)
    }
  }, [query.data, process])

  return (
    <CollectiblesContext.Provider
      value={{
        collectibles,
        getCollectible,
        refreshMetadata,
        isCollectibleRefreshing,
        refetch: query.refetch,
        isRefetching: query.isRefetching,
        isLoading: query.isLoading,
        setIsEnabled,
        isEnabled
      }}>
      {children}
    </CollectiblesContext.Provider>
  )
}

export function useCollectiblesContext(): CollectiblesContextState {
  return useContext(CollectiblesContext)
}
