import { TokenType } from '@avalabs/vm-module-types'
import { TokenActivityTransaction } from 'features/portfolio/assets/components/TokenActivityListItem'
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import GlacierService from 'services/glacier/GlacierService'
import NftProcessor from 'services/nft/NftProcessor'
import { NftItem, NftLocalStatus } from 'services/nft/types'
import { getNftLocalId, getTokenUri } from 'services/nft/utils'
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

    const contractAddress =
      token && 'address' in token ? token.address : tx.to.toString()
    const tokenId = token?.collectableTokenId?.toString() || ''
    const localId = getNftLocalId({
      address: contractAddress,
      tokenId
    })

    const initialCollectible = useMemo(() => {
      const chainId = Number(tx.chainId)

      return {
        localId,
        type: token?.type as TokenType.ERC721 | TokenType.ERC1155,
        address: contractAddress,
        tokenId,
        status: NftLocalStatus.Unprocessed,
        balance: BigInt(0),
        balanceDisplayValue: '',
        networkChainId: chainId,
        description: '',
        logoUri: '',
        logoSmall: '',
        name: '',
        symbol: '',
        tokenUri: '',
        collectionName: '',
        chainId
      }
    }, [contractAddress, localId, token?.type, tx.chainId, tokenId])

    const [collectible, setCollectible] = useState<NftItem>(initialCollectible)

    const getCollectible = useCallback(async () => {
      if (!isLoading) return
      if (!contractAddress || !tokenId) return

      try {
        const result = await GlacierService.getTokenDetails({
          address: contractAddress,
          chainId: tx.chainId,
          tokenId
        })
        if (!result) return

        const resolvedTokenUri = getTokenUri({
          tokenUri: result.tokenUri,
          tokenId
        })
        const processedMetadata = await NftProcessor.fetchMetadata(
          resolvedTokenUri
        )
        const imageData = await NftProcessor.fetchImage(
          processedMetadata.image ||
            processedMetadata.animation_url ||
            processedMetadata.external_url
        )
        const chainId = Number(tx.chainId)

        setCollectible({
          ...result,
          imageData,
          processedMetadata,
          localId,
          tokenId,
          type: token?.type as TokenType.ERC721 | TokenType.ERC1155,
          name: token?.name ?? '',
          address: contractAddress,
          status: NftLocalStatus.Processed,
          balance: BigInt(0),
          balanceDisplayValue: '',
          description: '',
          logoUri: '',
          logoSmall: '',
          collectionName: '',
          networkChainId: chainId,
          chainId,
          symbol: ''
        })
      } catch (error) {
        setCollectible({
          ...initialCollectible,
          status: NftLocalStatus.Unprocessable
        })
      }
    }, [
      contractAddress,
      initialCollectible,
      isLoading,
      localId,
      token?.name,
      token?.type,
      tokenId,
      tx.chainId
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
