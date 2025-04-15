import { NetworkWithCaip2ChainId } from 'store/network'
import { create } from 'zustand'

interface ReceiveStore {
  selectedNetwork: NetworkWithCaip2ChainId | null
  setSelectedNetwork: (network: NetworkWithCaip2ChainId) => void
}

export const useReceiveStore = create<ReceiveStore>(set => ({
  selectedNetwork: null,
  setSelectedNetwork: (network: NetworkWithCaip2ChainId) =>
    set({ selectedNetwork: network })
}))
