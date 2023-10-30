import { AppListenerEffectAPI } from 'store/index'
import { saveNfts, selectNfts, updateExistingNfts } from 'store/nft/slice'
import { AppStartListening } from 'store/middleware/listener'
import { pipeAsyncFunctions } from 'utils/js/pipeAsyncFunctions'
import { applyImageAndAspect, getNftUID } from 'services/nft/utils'
import { NFTItemData } from 'store/nft/types'
import nftProcessor from 'services/nft/NftProcessor'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const onSaveNfts = async (action: any, listenerApi: AppListenerEffectAPI) => {
  const { dispatch, getState } = listenerApi
  const state = getState()
  const nfts = selectNfts(state).filter(nft => !nft.isFullLoading)

  if (nfts.length === 0) {
    //nothing to process, get out
    return
  }
  const nftsToProcessMap: Record<string, NFTItemData> = {}

  //update is isFullLoading so we don't process it again
  nfts.forEach(nft => {
    nftsToProcessMap[getNftUID(nft)] = { ...nft, isFullLoading: true }
  })
  dispatch(updateExistingNfts({ nfts: Object.values(nftsToProcessMap) }))

  //start loading
  const processData = pipeAsyncFunctions(
    nftProcessor.applyMetadata.bind(nftProcessor),
    applyImageAndAspect
  )
  const nftBalancesWithMetaData = await Promise.allSettled(
    nfts.map(processData)
  )
  const fullNfts = nftBalancesWithMetaData.reduce<NFTItemData[]>(
    (acc, result) => {
      if (result.status === 'fulfilled') {
        return [...acc, result.value]
      } else {
        return acc
      }
    },
    []
  )

  //append loaded data
  fullNfts.forEach(fullNft => {
    const nftUID = getNftUID(fullNft)
    nftsToProcessMap[nftUID] = {
      ...nftsToProcessMap[nftUID],
      ...fullNft
    }
  })

  dispatch(updateExistingNfts({ nfts: Object.values(nftsToProcessMap) }))
}

export const addNftListeners = (startListening: AppStartListening) => {
  startListening({
    actionCreator: saveNfts,
    effect: onSaveNfts
  })
}
