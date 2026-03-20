import { ChainId } from '@avalabs/core-chains-sdk'

export enum UI {
  Bridge = 'Bridge',
  Swap = 'Swap'
}

// The list of features we want to disable on certain networks (blacklist)
const disabledUIs: Partial<Record<UI, number[]>> = {
  [UI.Bridge]: [
    ChainId.DFK,
    ChainId.DFK_TESTNET,
    ChainId.SWIMMER,
    ChainId.SWIMMER_TESTNET
  ],
  [UI.Swap]: [ChainId.AVALANCHE_P, ChainId.AVALANCHE_X]
}

export const useIsUIDisabledForNetwork = (
  ui: UI,
  chainId?: number
): boolean => {
  if (chainId === undefined) {
    return false
  }

  const disabled = disabledUIs[ui]

  return !(disabled && !disabled.includes(chainId))
}
