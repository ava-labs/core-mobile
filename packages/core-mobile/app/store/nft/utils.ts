import { CollectibleVisibility } from 'store/portfolio'
import { NftItem } from 'services/nft/types'

export function getLocalCollectibleId(collectible: NftItem): string {
  return collectible.localId.toLowerCase()
}

export function isCollectibleVisible(
  collectibleVisibility: CollectibleVisibility,
  collectible: NftItem
): boolean {
  const collectibleVisible =
    collectibleVisibility?.[collectible?.localId?.toLowerCase()]
  return collectibleVisible !== undefined ? collectibleVisible : true
}
