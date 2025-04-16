import { useQuery } from '@tanstack/react-query'
import { useNetworks } from 'hooks/networks/useNetworks'
import { NetworkWithCaip2ChainId } from 'store/network'
import { create } from 'zustand'

interface ReceiveStore {
  selectedNetwork: NetworkWithCaip2ChainId | null
  actions: {
    setSelectedNetwork: (network: NetworkWithCaip2ChainId) => void
  }
}

const useReceiveStore = create<ReceiveStore>(set => ({
  selectedNetwork: null,
  actions: {
    setSelectedNetwork: (network: NetworkWithCaip2ChainId) =>
      set({ selectedNetwork: network })
  }
}))

export const useReceiveSelectedNetwork = (): ReceiveStore['selectedNetwork'] =>
  useReceiveStore(state => state.selectedNetwork)

export const useReceiveActions = (): ReceiveStore['actions'] =>
  useReceiveStore(state => state.actions)
