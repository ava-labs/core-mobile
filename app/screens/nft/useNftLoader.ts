import {NftCollection, NFTItemData} from 'screens/nft/NftCollection'
import {useCallback, useEffect, useRef} from 'react'
import {UID} from 'Repo'
import {
  bufferTime,
  concat,
  concatMap,
  delay,
  filter,
  from,
  of,
  Subject
} from 'rxjs'
import {Image} from 'react-native'
import {useApplicationContext} from 'contexts/ApplicationContext'
import {getNftUID} from 'utils/TokenTools'

/**
 * Takes nft data and fetches the smallest images to calculate aspect ratio.
 * Then writes aspect ratio to data end emits in batch fashion.
 */
export const useNftLoader = (): {
  parseNftCollections: (nftCollections: NftCollection[]) => void
} => {
  const loadQueue$ = useRef(new Subject<NFTItemData>()).current
  const {nftRepo} = useApplicationContext().repo
  const nftRepoRef = useRef(new Map())

  useEffect(() => {
    nftRepoRef.current.clear()
    nftRepo.nfts.forEach((value, key) => {
      nftRepoRef.current.set(key, value)
    })
  }, [nftRepo.nfts])

  useEffect(() => {
    const subs = loadQueue$
      .pipe(
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
        concatMap(nftData => {
          // for each item create observable which will complete when image is fetched and aspect written
          // ignore if fetching image fails
          let resolver: (value: NFTItemData) => void
          const p = from(
            new Promise<NFTItemData>(resolve => (resolver = resolve))
          )
          Image.getSize(
            nftData.external_data.image_256,
            (width: number, height: number) => {
              nftData.aspect = height / width
              resolver(nftData)
            },
            _ => {
              resolver(nftData)
            }
          )
          return p
        }),
        bufferTime(1000),
        filter(value => value.length !== 0)
      )
      .subscribe({
        next: nftData => {
          // update data and save to repo
          nftData.forEach(item => {
            nftRepoRef.current.set(item.uid, item)
          })
          nftRepo.saveNfts(nftRepoRef.current)
        },
        error: err => console.error(err)
      })
    return () => subs.unsubscribe()
  }, [])

  const parseNftCollections = useCallback(
    (nftCollections: NftCollection[]) => {
      const nftDataItems = prepareNftData(nftCollections)
      applyKnownAspectRatios(nftDataItems, nftRepo.nfts)
      nftRepo.saveNfts(nftDataItems)

      nftDataItems.forEach(value => {
        if (!value.aspect) {
          loadQueue$.next(value)
        }
      })
    },
    [nftRepo.nfts]
  )

  return {
    parseNftCollections
  }
}

function prepareNftData(
  nftCollections: NftCollection[]
): Map<UID, NFTItemData> {
  const nftDataItems = new Map<UID, NFTItemData>()
  nftCollections.forEach(collection => {
    collection.nft_data?.forEach(nftData => {
      const nft = nftData as NFTItemData
      nft.collection = (({nft_data, ...o}) => o)(
        collection
      ) as unknown as NftCollection // remove nft_data to save on memory
      nft.isShowing = true
      nft.uid = getNftUID(nft)
      nftDataItems.set(nft.uid, nft)
    })
  })
  return nftDataItems
}

function applyKnownAspectRatios(
  nftDataItems: Map<UID, NFTItemData>,
  nfts: Map<UID, NFTItemData>
) {
  for (const [_, token] of nftDataItems) {
    if (nfts.has(token.uid)) {
      token.aspect = nfts.get(token.uid)!.aspect
    }
  }
}
