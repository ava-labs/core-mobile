import { useSelector } from 'react-redux'
import {
  BITCOIN_NETWORK,
  FUJI_NETWORK,
  selectActiveNetwork
} from 'store/network'

export enum UI {
  Collectibles = 'Collectibles',
  Swap = 'Swap',
  Buy = 'Buy',
  ManageTokens = 'ManageTokens'
}

const disabledUIs = {
  [BITCOIN_NETWORK.chainId]: [
    UI.Collectibles,
    UI.Swap,
    UI.Buy,
    UI.ManageTokens
  ],
  [FUJI_NETWORK.chainId]: [UI.Swap]
}

export const useIsUIDisabled = (ui: UI) => {
  const activeNetwork = useSelector(selectActiveNetwork)

  return disabledUIs[activeNetwork.chainId]?.includes(ui) ?? false
}
