import { ChainId } from '@avalabs/chains-sdk'
import { absoluteChain } from 'utils/network/isAvalancheNetwork'
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
  [UI.Swap]: [ChainId.AVALANCHE_MAINNET_ID],
  [UI.Buy]: [ChainId.AVALANCHE_MAINNET_ID, ChainId.AVALANCHE_TESTNET_ID]
}

// The list of features we want to disable on certain networks (blacklist)
const disabledUIs: Partial<Record<UI, number[]>> = {
  [UI.ManageTokens]: [
    ChainId.BITCOIN,
    ChainId.BITCOIN_TESTNET,
    ChainId.AVALANCHE_XP,
    ChainId.AVALANCHE_TEST_XP
  ],
  [UI.Bridge]: [
    ChainId.DFK,
    ChainId.DFK_TESTNET,
    ChainId.SWIMMER,
    ChainId.SWIMMER_TESTNET
  ],
  [UI.WalletConnect]: [] // empty array means this feature shouldn't be disabled on any network
}

export const useIsUIDisabled = (ui: UI): boolean => {
  const {
    activeNetwork: { chainId }
  } = useNetworks()

  if (enabledUIs[ui]?.includes(chainId)) {
    return false
  }

  const disabled = disabledUIs[ui]

  // Currently, the P-Chain and X-Chain have chain IDs (ChainId.AVALANCHE_XP)
  // that are the same value but with opposite signs. Therefore,
  // we convert them using the absoluteChain function for comparison.
  return !(disabled && !disabled.includes(absoluteChain(chainId)))
}
