import { NFTItemData } from 'screens/nft/NftCollection'

export function getNftUID(nft: NFTItemData): string {
  return nft.collection.contract_address + nft.token_id
}
