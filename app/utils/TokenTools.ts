import { Erc721TokenBalanceDto } from '@avalabs/glacier-sdk'

export function getNftUID(nft: Erc721TokenBalanceDto): string {
  return nft.contractAddress + nft.tokenId
}
