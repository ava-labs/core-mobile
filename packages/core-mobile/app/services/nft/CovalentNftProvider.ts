import { NftProvider } from 'services/nft/types'
import { NftResponse, NftTokenTypes } from 'store/nft'
import { Covalent } from '@avalabs/covalent-sdk'
import Config from 'react-native-config'
import { GetAddressBalanceV2Item } from '@avalabs/covalent-sdk'
import Logger from 'utils/Logger'
import DevDebuggingConfig from 'utils/debugging/DevDebuggingConfig'
import {
  Erc1155TokenBalance,
  Erc721TokenBalance,
  NftTokenMetadataStatus
} from '@avalabs/glacier-sdk'
import { addMissingFields, convertIPFSResolver } from './utils'

const demoAddress = 'demo.eth'
const demoChain = 1 //Ethereum
const NFT_TIMEOUT = 120000 // 2 minutes

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
        pageNumber: Number.parseInt(pageToken) ?? 0 // pagination is not working with Covalent
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
      (agg: NftTokenTypes[], item: GetAddressBalanceV2Item) => {
        return item.type !== 'nft'
          ? agg
          : [...agg, ...this.mapCovalentData(chainId.toString(), address, item)]
      },
      []
    )
    const fullNftData = nfts.map(nft => addMissingFields(nft, address))

    return {
      nfts: fullNftData,
      nextPageToken: nextPageToken
    }
  }

  mapCovalentData(
    chainId: string,
    address: string,
    nftCollections: GetAddressBalanceV2Item
  ): NftTokenTypes[] {
    if (nftCollections.nft_data === null) {
      return []
    }

    return nftCollections.nft_data.map(value => {
      return {
        ercType: (value.supports_erc.includes('erc1155')
          ? Erc1155TokenBalance.ercType
          : // Typing from the SDK has the ercType properties mixed up
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Erc721TokenBalance.ercType) as any,
        metadata: {
          indexStatus: NftTokenMetadataStatus.INDEXED,
          name: value.external_data.name,
          imageUri: value.external_data.image
            ? convertIPFSResolver(value.external_data.image)
            : '',
          symbol: nftCollections.contract_ticker_symbol,
          description: value.external_data.description,
          animationUri: value.external_data.animation_url || undefined,
          externalUrl: value.external_data.external_url || undefined
        },
        chainId,
        address,
        name: value.external_data.name,
        balance: value.token_balance,
        symbol: nftCollections.contract_ticker_symbol,
        tokenId: value.token_id,
        tokenUri: value.token_url ?? ''
      }
    })
  }
}

export default new CovalentNftProvider()
