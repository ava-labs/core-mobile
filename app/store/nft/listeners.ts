import { AppStartListening } from 'store/middleware/listener'
import { fetchNfts } from 'store/nft/slice'
import nftService from 'services/nft/NftService'

export const addNftListeners = (startListening: AppStartListening) => {
  startListening({
    actionCreator: fetchNfts,
    effect: async action => {
      const { chainId, address } = action.payload
      const response = await nftService.fetchNfts(chainId, address)
      console.log('fetching done', !!response.erc721TokenBalances)
      nftService.processNfts(response.erc721TokenBalances, address)
    }
  })
}
