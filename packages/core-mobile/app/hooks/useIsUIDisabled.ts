import { ChainId } from '@avalabs/chains-sdk'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import { Platform } from 'react-native'

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
  [UI.Swap]: [ChainId.AVALANCHE_MAINNET_ID],
  [UI.Buy]: [ChainId.AVALANCHE_MAINNET_ID, ChainId.AVALANCHE_TESTNET_ID]
}

// The list of features we want to disable on certain networks (blacklist)
const disabledUIs: Partial<Record<UI, number[]>> = {
  [UI.ManageTokens]: [ChainId.BITCOIN, ChainId.BITCOIN_TESTNET],
  [UI.Bridge]: [
    ChainId.DFK,
    ChainId.DFK_TESTNET,
    ChainId.SWIMMER,
    ChainId.SWIMMER_TESTNET
  ],
  [UI.WalletConnect]: [] // empty array means this feature shouldn't be disabled on any network
}

export const useIsUIDisabled = (ui: UI): boolean => {
  const { chainId } = useSelector(selectActiveNetwork)

  //keep this on top of this list
  if (Platform.OS === 'ios' && ui === UI.Buy) {
    return true
  }

  if (enabledUIs[ui]?.includes(chainId)) {
    return false
  }

  const disabled = disabledUIs[ui]
  return !(disabled && !disabled.includes(chainId))
}
