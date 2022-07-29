import { NftProvider } from 'services/nft/types'
import { NFTItemData, NftResponse } from 'store/nft'
import { Covalent } from '@avalabs/covalent-sdk'
import Config from 'react-native-config'
import { GetAddressBalanceV2Item } from '@avalabs/covalent-sdk/src/models'
import Logger from 'utils/Logger'
import DevDebuggingConfig from 'utils/debugging/DevDebuggingConfig'
import { getNftUID } from 'services/nft/NftService'
import nftProcessor from 'services/nft/NftProcessor'

const demoAddress = 'demo.eth'
const demoChain = 1 //Ethereum

export class CovalentNftProvider implements NftProvider {
  async isProviderFor(chainId: number): Promise<boolean> {
    chainId
    return true
  }

  async fetchNfts(
    chainId: number,
    address: string,
    pageToken = '0',
    selectedCurrency = 'USD'
  ): Promise<NftResponse> {
    Logger.info('fetching nfts using Covalent')
    const chainID = DevDebuggingConfig.SHOW_DEMO_NFTS ? demoChain : chainId
    const covalent = new Covalent(chainID, Config.COVALENT_API_KEY)
    const addressToGet = DevDebuggingConfig.SHOW_DEMO_NFTS
      ? demoAddress
      : address

    const covalentResponse = await covalent.getAddressBalancesV2(
      addressToGet,
      true,
      selectedCurrency.toUpperCase(),
      {
        pageSize: 100,
        pageNumber: Number.parseInt(pageToken) ?? 0
      }
    )
    const covalentData = covalentResponse.data
    const covalentNfts = covalentData.items
    const nextPageToken =
      covalentData.pagination?.has_more === true
        ? covalentData.pagination.page_number + 1
        : undefined

    const nfts = covalentNfts.reduce(
      (agg: NFTItemData[], item: GetAddressBalanceV2Item) => {
        return item.type !== 'nft'
          ? agg
          : [...agg, ...this.mapCovalentData(chainId.toString(), address, item)]
      },
      []
    )

    const fullNftPromises = nfts.map(nft => this.applyImageAndAspect(nft))
    const fullNftResults = await Promise.allSettled(fullNftPromises)
    const fullNftData = [] as NFTItemData[]
    fullNftResults.forEach(result => {
      if (result.status === 'fulfilled') {
        fullNftData.push(result.value)
      }
    })

    const nftData = fullNftData.map(nft => {
      return {
        ...nft,
        uid: getNftUID(nft),
        isShowing: true,
        owner: address
      } as NFTItemData
    })

    return {
      nfts: nftData,
      nextPageToken
    } as NftResponse
  }

  private async applyImageAndAspect(nftData: NFTItemData) {
    const [image, aspect, isSvg] = await nftProcessor.fetchImageAndAspect(
      nftData.image
    )
    nftData.image = image
    nftData.aspect = aspect
    nftData.isSvg = isSvg
    return nftData
  }

  mapCovalentData(
    chainId: string,
    address: string,
    nftCollections: GetAddressBalanceV2Item
  ): NFTItemData[] {
    if (nftCollections.nft_data === null) {
      return []
    }

    return nftCollections.nft_data.map(value => {
      return {
        chainId: chainId,
        contractAddress: address,
        name: value.external_data.name,
        symbol: nftCollections.contract_ticker_symbol,
        tokenId: value.token_id,
        tokenUri: value.token_url,
        image: value.external_data.image,
        image_256: value.external_data.image_256,
        // attributes:
        //   value.external_data.attributes?.map(
        //     attr =>
        //       ({
        //         trait_type: attr.trait_type,
        //         value: attr.value
        //       } as NFTItemExternalDataAttribute)
        //   ) ?? [],
        description: value.external_data.description,
        external_url: value.external_data.external_url,
        animation_url: value.external_data.animation_url,
        owner: value.owner
      } as NFTItemData
    })
  }
}

export default new CovalentNftProvider()
