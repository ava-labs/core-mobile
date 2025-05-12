import { Network } from '@avalabs/core-chains-sdk'
import ModuleManager from 'vmModule/ModuleManager'
import { TokenType } from '@avalabs/vm-module-types'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'
import { coingeckoInMemoryCache } from 'utils/coingeckoInMemoryCache'
import Logger from 'utils/Logger'
import { getNftLocalId, isNft } from './utils'
import { UnprocessedNftItem } from './types'

export class NftService {
  async fetchNfts({
    network,
    address,
    currency
  }: {
    network: Network
    address: string
    currency: string
  }): Promise<UnprocessedNftItem[]> {
    const module = await ModuleManager.loadModuleByNetwork(network)

    const balancesResponse = await module.getBalances({
      addresses: [address],
      currency,
      network: mapToVmNetwork(network),
      storage: coingeckoInMemoryCache,
      tokenTypes: [TokenType.ERC721, TokenType.ERC1155]
    })

    const balances = balancesResponse[address]

    if (!balances || 'error' in balances) {
      Logger.error('Failed to fetch NFTs', balances?.error)

      return Promise.reject(`Failed to fetch NFTs`)
    }

    const nfts = []
    for (const tokenId in balances) {
      const token = balances[tokenId]

      if (!token || 'error' in token) {
        continue
      }

      if (isNft(token)) {
        nfts.push({
          ...token,
          localId: getNftLocalId(token),
          networkChainId: network.chainId
        })
      }
    }

    return nfts
  }
}

export default new NftService()
