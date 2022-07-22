import { NftProvider } from 'services/nft/types'
import {
  bufferTime,
  concat,
  concatMap,
  delay,
  filter,
  from,
  map,
  mergeMap,
  of,
  Subject,
  Subscription
} from 'rxjs'
import { Erc721TokenBalance } from '@avalabs/glacier-sdk'
import { NFTItemData, saveNFT } from 'store/nft'
import { store } from 'store'
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
  private loadQueue$ = new Subject<NFTItemData>()
  private nftProcessor$ = this.setupNftProcessor()
  private processorSubscription: Subscription | undefined = undefined

  async isProviderFor(chainId: number): Promise<boolean> {
    chainId
    return true
  }

  async fetchNfts(
    chainId: number,
    address: string,
    selectedCurrency?: string
  ): Promise<void> {
    Logger.info('fetching nfts using Covalent')
    const chainID = DevDebuggingConfig.SHOW_DEMO_NFTS ? demoChain : chainId
    const covalent = new Covalent(chainID, Config.COVALENT_API_KEY)
    const addressToGet = DevDebuggingConfig.SHOW_DEMO_NFTS
      ? demoAddress
      : address

    const covalentResponse = await covalent.getAddressBalancesV2(
      addressToGet,
      true,
      selectedCurrency?.toUpperCase() ?? 'USD',
      {
        pageSize: 100,
        pageNumber: 0
      }
    )
    const covalentNfts = covalentResponse.data.items
    const nfts = covalentNfts.reduce(
      (agg: NFTItemData[], item: GetAddressBalanceV2Item) => {
        return item.type !== 'nft'
          ? agg
          : [...agg, ...this.mapCovalentData(chainId.toString(), address, item)]
      },
      []
    )

    this.processNfts(nfts, address)
  }

  stop() {
    if (this.processorSubscription) {
      this.processorSubscription.unsubscribe()
      this.processorSubscription = undefined
    }
  }

  private processNfts(nfts: Erc721TokenBalance[], owner: string) {
    if (!this.processorSubscription) {
      this.startProcessor(owner)
    }
    nfts.forEach(value =>
      this.loadQueue$.next({
        uid: getNftUID(value),
        isShowing: true,
        owner,
        ...value
      } as NFTItemData)
    )
  }

  private startProcessor(owner: string) {
    this.processorSubscription = this.nftProcessor$.subscribe({
      next: nftData => {
        // update data and save to repo
        nftData.forEach(item => {
          store.dispatch(
            saveNFT({
              chainId: Number.parseInt(item.chainId),
              address: owner,
              token: item
            })
          )
        })
      },
      error: err => console.error(err)
    })
  }

  private setupNftProcessor() {
    return this.loadQueue$.pipe(
      filter(nftData => !!nftData),
      bufferTime(1000),
      filter(value => value.length !== 0),
      concatMap(value => {
        // make batches of 10 items, each delayed for 1 sec except first one
        const newObservables = []
        const batchCount = 10
        for (let i = 0; i < value.length; i += batchCount) {
          let observable = of(value.slice(i, i + batchCount))
          if (i !== 0) {
            observable = observable.pipe(delay(1000))
          }
          newObservables.push(observable)
        }
        return concat(...newObservables)
      }),
      concatMap(nfts => {
        // expand batch
        return from(nfts)
      }),
      mergeMap(nftData => {
        // for each item create observable which will complete when image is fetched and aspect written
        // Set aspect to 1 if image load fails
        if (!nftData.image) {
          return of(nftData)
        } else {
          return from(nftProcessor.fetchImageAndAspect(nftData.image)).pipe(
            map(([image, aspect, isSvg]) => {
              nftData.image = image
              nftData.aspect = aspect
              nftData.isSvg = isSvg
              return nftData
            })
          )
        }
      }),
      bufferTime(1000),
      filter(value => value.length !== 0)
    )
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
