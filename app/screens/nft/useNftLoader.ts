import {NftCollection, NFTItemData} from 'screens/nft/NftCollection';
import {useCallback, useEffect, useRef} from 'react';
import {UID} from 'Repo';
import {
  bufferCount,
  bufferTime,
  concatMap,
  filter,
  from,
  interval,
  startWith,
  Subject,
  switchMap,
  zipWith,
} from 'rxjs';
import {Image} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';

/**
 * Takes nft data and fetches the smallest images to calculate aspect ratio.
 * Then writes aspect ratio to data end emits in batch fashion.
 */
export const useNftLoader = (): {
  parseNftCollections: (nftCollections: NftCollection[]) => void;
} => {
  const cache = useRef(new Map<UID, NFTItemData>()).current;
  const loadQueue$ = useRef(new Subject<NFTItemData>()).current;
  const {nftRepo} = useApplicationContext().repo;

  useEffect(() => {
    const subs = loadQueue$
      .pipe(
        filter(
          nftData =>
            !!nftData &&
            (!cache.has(nftData.token_id) ||
              !!cache.get(nftData.token_id)!.aspect),
        ),
        bufferCount(10),
        zipWith(interval(1000).pipe(startWith(0))),
        switchMap(([nfts, _]) => {
          console.log('expanding batch');
          return from(nfts);
        }),
        concatMap(nftData => {
          console.log('load image for ', nftData.token_id);
          let resolver: (value: NFTItemData) => void;
          const p = from(
            new Promise<NFTItemData>(resolve => (resolver = resolve)),
          );
          Image.getSize(
            nftData.external_data.image_256,
            (width: number, height: number) => {
              nftData.aspect = height / width;
              cache.set(nftData.token_id, nftData);
              console.log('set to cache');
              resolver(nftData);
            },
            _ => {
              // console.warn(error);
              resolver(nftData);
            },
          );
          return p;
        }),
        bufferTime(900),
      )
      .subscribe({
        next: _ => {
          const toUpdate = new Map(nftRepo.nfts);
          cache.forEach((value, key) => {
            toUpdate.set(key, value);
          });
          nftRepo.saveNfts(toUpdate);
        },
        error: err => console.error(err),
        complete: () => console.warn('completed'),
      });
    return () => subs.unsubscribe();
  }, []);

  const parseNftCollections = useCallback(
    (nftCollections: NftCollection[]) => {
      console.log('******** parseNftCollections ***********');
      const nftDataItems = prepareNftData(nftCollections);
      applyKnownAspectRatios(nftDataItems, nftRepo.nfts);
      nftRepo.saveNfts(nftDataItems);

      nftDataItems.forEach(value => {
        if (!value.aspect) {
          loadQueue$.next(value);
        }
      });
    },
    [nftRepo.nfts],
  );

  return {
    parseNftCollections,
  };
};

function prepareNftData(
  nftCollections: NftCollection[],
): Map<UID, NFTItemData> {
  const nftDataItems = new Map<UID, NFTItemData>();
  nftCollections.forEach(collection => {
    collection.nft_data?.forEach(nftData => {
      const nft = nftData as NFTItemData;
      nft.collection = (({nft_data, ...o}) => o)(
        collection,
      ) as unknown as NftCollection; // remove nft_data to save on memory
      nft.isShowing = true;
      nftDataItems.set(nft.token_id, nft);
    });
  });
  return nftDataItems;
}

function applyKnownAspectRatios(
  nftDataItems: Map<UID, NFTItemData>,
  nfts: Map<UID, NFTItemData>,
) {
  for (const [_, token] of nftDataItems) {
    if (nfts.has(token.token_id)) {
      token.aspect = nfts.get(token.token_id)!.aspect;
    }
  }
}
