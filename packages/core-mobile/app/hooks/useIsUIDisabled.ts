import { ChainId } from '@avalabs/core-chains-sdk'

export enum UI {
  Swap = 'Swap',
  Bridge = 'Bridge'
}

// The list of features we want to enable on certain networks (whitelist)
const enabledUIs: Partial<Record<UI, number[]>> = {
  [UI.Swap]: [ChainId.AVALANCHE_MAINNET_ID, ChainId.SOLANA_MAINNET_ID]
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

  if (enabledUIs[ui]?.includes(chainId)) {
    return false
  }

  const disabled = disabledUIs[ui]

  return !(disabled && !disabled.includes(chainId))
}
