import { NFTItemData } from 'store/nft'

export const LOADER_UID = 'LOADER_UID'

export const appendLoader = (data: NFTItemData[]) => {
  const loader = {
    uid: LOADER_UID
  } as NFTItemData
  return [...data, loader]
}
