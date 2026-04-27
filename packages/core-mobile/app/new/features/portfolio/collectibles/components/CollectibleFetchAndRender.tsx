import { TokenType } from '@avalabs/vm-module-types'
import { findNftToken } from 'features/activity/utils'
import { TokenActivityTransaction } from 'features/portfolio/assets/components/TokenActivityListItem'
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { NftItem, NftLocalStatus } from 'services/nft/types'
import { fetchNftData, getNftLocalId, isNftTokenType } from 'services/nft/utils'
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
    // When the tx has no ERC721/ERC1155 leg (rare backend inconsistency for
    // NFT_* txTypes), `token` is undefined; the metadata fetch below short-
    // circuits on missing contractAddress/tokenId so we fall back to an
    // unprocessed placeholder card instead of fetching the wrong asset.
    const token = findNftToken(tx)
    const [isLoading, setIsLoading] = useState(true)

    const contractAddress = token && 'address' in token ? token.address : ''
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

      const tokenType = token?.type
      if (!isNftTokenType(tokenType)) return

      try {
        const data = await fetchNftData(contractAddress, tokenId, tx.chainId)
        if (!data) return

        const chainId = Number(tx.chainId)
        setCollectible({
          ...data.result,
          imageData: data.imageData,
          processedMetadata: data.processedMetadata,
          localId,
          tokenId,
          type: tokenType,
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
        setIsLoading(false)
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
