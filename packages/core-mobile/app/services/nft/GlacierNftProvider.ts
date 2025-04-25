import {
  Erc1155Token,
  Erc1155TokenMetadata,
  Erc721Token,
  Erc721TokenMetadata
} from '@avalabs/glacier-sdk'
import DevDebuggingConfig from 'utils/debugging/DevDebuggingConfig'
import GlacierService from 'services/glacier/GlacierService'
import delay from 'utils/js/delay'

const demoAddress = '0x188c30e9a6527f5f0c3f7fe59b72ac7253c62f28'

export class GlacierNftProvider {
  async fetchNft(
    address: string,
    chainId: number,
    tokenId: string
  ): Promise<Erc721Token | Erc1155Token> {
    return await GlacierService.getTokenDetails({
      chainId: chainId.toString(),
      address: DevDebuggingConfig.SHOW_DEMO_NFTS ? demoAddress : address,
      tokenId: tokenId
    })
  }

  async reindexNft(
    address: string,
    chainId: number,
    tokenId: string
  ): Promise<Erc721TokenMetadata | Erc1155TokenMetadata> {
    const requestTimestamp = Math.floor(Date.now() / 1000)
    const maxAttempts = 10 // Amount of fetches after which we give up.

    await GlacierService.reindexNft({
      address,
      chainId: chainId.toString(),
      tokenId
    })

    let token: Erc721Token | Erc1155Token | null = null
    let fetchCount = 0
    let shouldPoll = true

    do {
      await delay(2000) // Wait 2 seconds before trying to fetch refreshed data.
      fetchCount += 1

      token = await this.fetchNft(address, chainId, tokenId)

      // Glacier is supposed to update "metadataLastUpdatedTimestamp" field even
      // if re-indexing fails for whatever reason, so if it is undefined, the NFT
      // was likely never indexed before. After a successful indexing, the field
      // should be populated.
      shouldPoll =
        typeof token.metadata.metadataLastUpdatedTimestamp === 'undefined' ||
        token.metadata.metadataLastUpdatedTimestamp < requestTimestamp

      // If we reached max. attempts and NFT is still not updated, throw an error.
      if (shouldPoll && fetchCount >= maxAttempts) {
        throw new Error('Failed to reindex NFT')
      }
    } while (shouldPoll)

    return token.metadata
  }
}

export default new GlacierNftProvider()
