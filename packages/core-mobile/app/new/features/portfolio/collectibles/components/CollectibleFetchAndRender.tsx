import { TokenType } from '@avalabs/vm-module-types'
import { TokenActivityTransaction } from 'features/portfolio/assets/components/TokenActivityListItem'
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import GlacierService from 'services/glacier/GlacierService'
import NftProcessor from 'services/nft/NftProcessor'
import { NftItem, NftLocalStatus } from 'services/nft/types'
import { getNftLocalId } from 'services/nft/utils'
import { CardContainer } from './CardContainer'
import { CollectibleRenderer } from './CollectibleRenderer'

export const CollectibleFetchAndRender = memo(
  ({
    tx,
    size = 36,
    iconSize = 20
  }: {
    tx: TokenActivityTransaction
    size: number
    iconSize: number
  }): JSX.Element => {
    const token = tx.tokens[0]
    const [isLoading, setIsLoading] = useState(true)

    const localId = getNftLocalId({
      address: tx.to.toString(),
      tokenId: token?.collectableTokenId?.toString() || ''
    })
    const tokenId = token?.collectableTokenId?.toString() || ''

    const initialCollectible = useMemo(() => {
      return {
        localId,
        type: token?.type as TokenType.ERC721 | TokenType.ERC1155,
        address: tx.to.toString(),
        tokenId,
        status: NftLocalStatus.Unprocessed,
        balance: BigInt(0),
        balanceDisplayValue: '',
        networkChainId: Number(tx.chainId),
        description: '',
        logoUri: '',
        logoSmall: '',
        name: '',
        symbol: '',
        tokenUri: '',
        collectionName: ''
      }
    }, [localId, token?.type, tx.to, tx.chainId, tokenId])

    const [collectible, setCollectible] = useState<NftItem>(initialCollectible)

    const getCollectible = useCallback(async () => {
      if (!isLoading) {
        return
      }
      if (token?.to && token.collectableTokenId) {
        try {
          const result = await GlacierService.getTokenDetails({
            address: tx.to.toString(),
            chainId: tx.chainId,
            tokenId
          })
          if (result) {
            const processedMetadata = await NftProcessor.fetchMetadata(
              result.tokenUri
            )
            const imageData = await NftProcessor.fetchImageAndAspect(
              processedMetadata.image ||
                processedMetadata.animation_url ||
                processedMetadata.external_url
            )

            setCollectible({
              ...result,
              imageData,
              processedMetadata,
              localId,
              tokenId,
              type: token?.type as TokenType.ERC721 | TokenType.ERC1155,
              name: token.name,
              address: tx.to.toString(),
              status: NftLocalStatus.Processed,
              balance: BigInt(0),
              balanceDisplayValue: '',
              description: '',
              logoUri: '',
              logoSmall: '',
              collectionName: '',
              networkChainId: Number(tx.chainId),
              symbol: ''
            })
          }
        } catch (error) {
          setCollectible({
            ...initialCollectible,
            status: NftLocalStatus.Unprocessable
          })
        }
      }
    }, [
      initialCollectible,
      isLoading,
      localId,
      token?.collectableTokenId,
      token?.name,
      token?.to,
      token?.type,
      tokenId,
      tx.chainId,
      tx.to
    ])

    useEffect(() => {
      getCollectible()
    }, [getCollectible])

    return (
      <CardContainer
        style={{
          height: size,
          width: size,
          borderRadius: 10
        }}>
        <CollectibleRenderer
          iconSize={iconSize}
          onLoaded={() => setIsLoading(false)}
          videoProps={{
            hideControls: true
          }}
          collectible={collectible}
        />
      </CardContainer>
    )
  }
)
