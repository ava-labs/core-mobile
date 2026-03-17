import { ChainId } from '@avalabs/core-chains-sdk'

export enum UI {
  Bridge = 'Bridge'
}

// The list of features we want to disable on certain networks (blacklist)
const disabledUIs: Partial<Record<UI, number[]>> = {
  [UI.Bridge]: [
    ChainId.DFK,
    ChainId.DFK_TESTNET,
    ChainId.SWIMMER,
    ChainId.SWIMMER_TESTNET
  ]
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
