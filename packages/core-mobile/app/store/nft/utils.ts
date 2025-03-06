import { CollectibleVisibility } from 'store/portfolio'
import { NFTItem } from './types'

export function getLocalCollectibleId(collectible: NFTItem): string {
  return collectible.uid.toLowerCase()
}

export function isCollectibleVisible(
  collectibleVisibility: CollectibleVisibility,
  collectible: NFTItem
): boolean {
  const collectibleVisible =
    collectibleVisibility?.[collectible?.uid?.toLowerCase()]
  return collectibleVisible !== undefined ? collectibleVisible : true
}
