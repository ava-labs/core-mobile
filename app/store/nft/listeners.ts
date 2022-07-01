import { AppStartListening } from 'store/middleware/listener'
import { fetchNfts } from 'store/nft/slice'
import nftService from 'services/nft/NftService'
import Logger from 'utils/Logger'
import { selectSelectedCurrency } from 'store/settings/currency'

export const addNftListeners = (startListening: AppStartListening) => {
  startListening({
    actionCreator: fetchNfts,
    effect: async (action, listenerApi) => {
      const state = listenerApi.getState()
      const selectedCurrency = selectSelectedCurrency(state)
      const { chainId, address } = action.payload
      const provider = await nftService.getProvider(chainId)
      if (!provider) {
        Logger.error('no available providers')
        return
      }
      await provider.fetchNfts(chainId, address, selectedCurrency)
    }
  })
}
