import { ChainId } from '@avalabs/chains-sdk'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'

export enum UI {
  Collectibles = 'Collectibles',
  Swap = 'Swap',
  Buy = 'Buy',
  ManageTokens = 'ManageTokens'
}

const disabledUIs: Record<number, UI[]> = {
  [ChainId.BITCOIN]: [UI.Collectibles, UI.Swap, UI.Buy, UI.ManageTokens],
  [ChainId.AVALANCHE_TESTNET_ID]: [UI.Swap]
}

export const useIsUIDisabled = (ui: UI) => {
  const activeNetwork = useSelector(selectActiveNetwork)

  return disabledUIs[activeNetwork.chainId]?.includes(ui) ?? false
}
