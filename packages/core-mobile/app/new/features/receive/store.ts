import { Network } from '@avalabs/core-chains-sdk'
import { AVALANCHE_MAINNET_NETWORK } from 'services/network/consts'
import { create } from 'zustand'

interface ReceiveStore {
  selectedNetwork: Network
  actions: {
    setSelectedNetwork: (network: Network) => void
  }
}

const useReceiveStore = create<ReceiveStore>(set => ({
  selectedNetwork: AVALANCHE_MAINNET_NETWORK as Network,
  actions: {
    setSelectedNetwork: (network: Network) => set({ selectedNetwork: network })
  }
}))

export const useReceiveSelectedNetwork = (): ReceiveStore['selectedNetwork'] =>
  useReceiveStore(state => state.selectedNetwork)

export const useReceiveActions = (): ReceiveStore['actions'] =>
  useReceiveStore(state => state.actions)
