import { HttpClient } from '@avalabs/utils-sdk'
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
import { Erc721TokenBalance, GlacierClient } from '@avalabs/glacier-sdk'
import { NFTItemData, NFTItemExternalData, saveNFT } from 'store/nft'
import { Image } from 'react-native'
import { store } from 'store'
import Logger from 'utils/Logger'
import DevDebuggingConfig from 'utils/debugging/DevDebuggingConfig'
import { getNftUID } from 'services/nft/NftService'

// const base64 = require('base-64')
const base64Prefix = 'data:image/svg+xml;base64,'
const demoAddress = '0x188c30e9a6527f5f0c3f7fe59b72ac7253c62f28'

export class GlacierNftProvider implements NftProvider {
  private loadQueue$ = new Subject<NFTItemData>()
  private nftProcessor$ = this.setupNftProcessor()
  private processorSubscription: Subscription | undefined = undefined
  private metadataHttpClient = new HttpClient(``, {})

  private glacierSdk = new GlacierClient(
    `https://glacier-api.avax-test.network`
  )

  async isProviderFor(chainId: number): Promise<boolean> {
    //TODO: check if glacier available
    const supportedChainsResp = await this.glacierSdk.supportedChains()
    const chainInfos = supportedChainsResp.chains
    const chains = chainInfos.map(chain => chain.chainId)
    return chains.some(value => value === chainId.toString())
  }

  async fetchNfts(
    chainId: number,
    address: string,
    selectedCurrency?: string
  ): Promise<void> {
    Logger.info('fetching nfts using Glacier')
    const nftBalancesResp = await this.glacierSdk.listErc721Balances(
      chainId.toString(),
      DevDebuggingConfig.SHOW_DEMO_NFTS ? demoAddress : address,
      {
        currency: selectedCurrency?.toLocaleLowerCase() as
          | 'usd'
          | 'eur'
          | 'aud'
          | 'cad'
          | 'chf'
          | 'clp'
          | 'czk'
          | 'dkk'
          | 'gbp'
          | 'hkd'
          | 'huf'
          | undefined,
        // glacier has a cap on page size of 100
        pageSize: 100
      }
    )
    const nftBalances = nftBalancesResp.erc721TokenBalances
    this.processNfts(nftBalances, address)
  }

  stop() {
    if (this.processorSubscription) {
      this.processorSubscription.unsubscribe()
      this.processorSubscription = undefined
    }
  }

  private processNfts(nfts: Erc721TokenBalance[], owner: string) {
    if (!this.processorSubscription) {
      this.startProcessor()
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

  private startProcessor() {
    this.processorSubscription = this.nftProcessor$.subscribe({
      next: nftData => {
        // update data and save to repo
        nftData.forEach(item => {
          store.dispatch(
            saveNFT({
              chainId: Number.parseInt(item.chainId, 10),
              address: item.owner,
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
        // get metadata
        if (nftData.tokenUri.startsWith('data:application/json;base64,')) {
          const base64Metadata = nftData.tokenUri.substring(
            'data:application/json;base64,'.length
          )
          const metadata = JSON.parse(
            Buffer.from(base64Metadata, 'base64').toString()
          )
          nftData = { ...metadata, ...nftData }
          return of(nftData)
        } else {
          return from(this.metadataHttpClient.get(nftData.tokenUri)).pipe(
            map(value => {
              const metadata = value as NFTItemExternalData
              nftData = { ...metadata, ...nftData }
              return nftData
            })
          )
        }
      }),
      mergeMap(nftData => {
        // for each item create observable which will complete when image is fetched and aspect written
        // Set aspect to 1 if image load fails
        const promise = new Promise<NFTItemData>(resolve => {
          if (isBase64Svg(nftData.image)) {
            //TODO decode base64 and get viewBox data for aspect, store decoded data
            nftData.aspect = 1
            resolve(nftData)
          } else {
            Image.getSize(
              nftData.image,
              (width: number, height: number) => {
                nftData.aspect = height / width
                resolve(nftData)
              },
              _ => {
                nftData.aspect = 1
                resolve(nftData)
              }
            )
          }
        })

        return from(promise)
      }),
      bufferTime(1000),
      filter(value => value.length !== 0)
    )
  }
}

function isBase64Svg(imageData: string) {
  return imageData.startsWith(base64Prefix)
}

// function convertBase64Svg(svgData: string) {
//   const base64Data = svgData.substring(base64Prefix.length)
//   console.log(base64Data)
//   return base64Prefix + base64.decode(base64Data).toString()
// }

export default new GlacierNftProvider()
