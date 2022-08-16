import { NftProvider } from 'services/nft/types'
import { NFTItemData, NftResponse } from 'store/nft'
import { Covalent } from '@avalabs/covalent-sdk'
import Config from 'react-native-config'
import { GetAddressBalanceV2Item } from '@avalabs/covalent-sdk/src/models'
import Logger from 'utils/Logger'
import DevDebuggingConfig from 'utils/debugging/DevDebuggingConfig'
import { pipeAsyncFunctions } from 'utils/js/pipeAsyncFunctions'
import {
  addMissingFields,
  applyImageAndAspect,
  convertIPFSResolver
} from './utils'

const demoAddress = 'demo.eth'
const demoChain = 1 //Ethereum
const NFT_TIMEOUT = 120_000 // 2 minutes

export class CovalentNftProvider implements NftProvider {
  async isProviderFor(chainId: number): Promise<boolean> {
    chainId
    return true
  }

  async fetchNfts(
    chainId: number,
    address: string,
    selectedCurrency = 'USD',
    pageToken = '0'
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
        pageNumber: Number.parseInt(pageToken, 10) ?? 0 // pagination is not working with Covalent
      },
      {
        customOptions: { timeout: NFT_TIMEOUT }
      }
    )
    const covalentData = covalentResponse.data
    const covalentNfts = covalentData.items
    const nextPageToken =
      covalentData.pagination?.has_more === true
        ? (covalentData.pagination.page_number + 1).toString()
        : '' // stop pagination

    const nfts = covalentNfts.reduce(
      (agg: NFTItemData[], item: GetAddressBalanceV2Item) => {
        return item.type !== 'nft'
          ? agg
          : [...agg, ...this.mapCovalentData(chainId.toString(), address, item)]
      },
      []
    )

    const processData = pipeAsyncFunctions(
      applyImageAndAspect,
      addMissingFields(address)
    )

    const fullNftResults = await Promise.allSettled(nfts.map(processData))

    const fullNftData = fullNftResults.reduce<NFTItemData[]>((acc, result) => {
      return result.status === 'fulfilled' ? [...acc, result.value] : acc
    }, [])

    return {
      nfts: fullNftData,
      nextPageToken
    }
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
        chainId,
        address,
        name: value.external_data.name,
        symbol: nftCollections.contract_ticker_symbol,
        tokenId: value.token_id,
        tokenUri: value.token_url,
        image: value.external_data.image
          ? convertIPFSResolver(value.external_data.image)
          : '',
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
