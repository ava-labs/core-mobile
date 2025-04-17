import { NetworkWithCaip2ChainId } from 'store/network'
import { create } from 'zustand'
import { AVALANCHE_MAINNET_NETWORK } from 'services/network/consts'

interface ReceiveStore {
  selectedNetwork: NetworkWithCaip2ChainId
  actions: {
    setSelectedNetwork: (network: NetworkWithCaip2ChainId) => void
  }
}

const useReceiveStore = create<ReceiveStore>(set => ({
  selectedNetwork: AVALANCHE_MAINNET_NETWORK,
  actions: {
    setSelectedNetwork: (network: NetworkWithCaip2ChainId) =>
      set({ selectedNetwork: network })
  }
}))

export const useReceiveSelectedNetwork = (): ReceiveStore['selectedNetwork'] =>
  useReceiveStore(state => state.selectedNetwork)

export const useReceiveActions = (): ReceiveStore['actions'] =>
  useReceiveStore(state => state.actions)
