import { ChainId } from '@avalabs/core-chains-sdk'
import { useNetworks } from './networks/useNetworks'

export enum UI {
  Collectibles = 'Collectibles',
  Swap = 'Swap',
  Buy = 'Buy',
  ManageTokens = 'ManageTokens',
  Bridge = 'Bridge',
  WalletConnect = 'WalletConnect'
}

// The list of features we want to enable on certain networks (whitelist)
const enabledUIs: Partial<Record<UI, number[]>> = {
  [UI.Collectibles]: [
    ChainId.AVALANCHE_MAINNET_ID,
    ChainId.AVALANCHE_TESTNET_ID,
    ChainId.ETHEREUM_HOMESTEAD,
    ChainId.ETHEREUM_TEST_GOERLY,
    ChainId.ETHEREUM_TEST_RINKEBY,
    ChainId.ETHEREUM_TEST_SEPOLIA
  ],
  [UI.Swap]: [ChainId.AVALANCHE_MAINNET_ID]
}

// The list of features we want to disable on certain networks (blacklist)
const disabledUIs: Partial<Record<UI, number[]>> = {
  [UI.ManageTokens]: [
    ChainId.BITCOIN,
    ChainId.BITCOIN_TESTNET,
    ChainId.AVALANCHE_X,
    ChainId.AVALANCHE_TEST_X,
    ChainId.AVALANCHE_P,
    ChainId.AVALANCHE_TEST_P
  ],
  [UI.Bridge]: [
    ChainId.DFK,
    ChainId.DFK_TESTNET,
    ChainId.SWIMMER,
    ChainId.SWIMMER_TESTNET
  ],
  [UI.WalletConnect]: [], // empty array means this feature shouldn't be disabled on any network
  [UI.Buy]: []
}

/**
 * @deprecated
 * use `useIsUIDisabledForNetwork` instead
 */
export const useIsUIDisabled = (ui: UI): boolean => {
  const {
    activeNetwork: { chainId }
  } = useNetworks()

  if (enabledUIs[ui]?.includes(chainId)) {
    return false
  }

  const disabled = disabledUIs[ui]

  return !(disabled && !disabled.includes(chainId))
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
