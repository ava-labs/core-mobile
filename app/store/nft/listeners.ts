import { AppStartListening } from 'store/middleware/listener'
import { fetchNfts } from 'store/nft/slice'
import nftService from 'services/nft/NftService'
import { selectSelectedCurrency } from 'store/settings/currency'

export const addNftListeners = (startListening: AppStartListening) => {
  startListening({
    actionCreator: fetchNfts,
    effect: async (action, listenerApi) => {
      const state = listenerApi.getState()
      const selectedCurrency = selectSelectedCurrency(state)
      const { chainId, address } = action.payload
      await nftService.fetchNft(chainId, address, selectedCurrency)
    }
  })
}
