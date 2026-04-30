import { ChainId } from '@avalabs/core-chains-sdk'

export enum UI {
  Swap = 'Swap'
}

// The list of features we want to disable on certain networks (blacklist)
const disabledUIs: Partial<Record<UI, number[]>> = {
  [UI.Swap]: [ChainId.AVALANCHE_P, ChainId.AVALANCHE_X]
}

export const isUIDisabledForNetwork = (ui: UI, chainId?: number): boolean => {
  if (chainId === undefined) {
    return false
  }

  const disabled = disabledUIs[ui]

  return !(disabled && !disabled.includes(chainId))
}
