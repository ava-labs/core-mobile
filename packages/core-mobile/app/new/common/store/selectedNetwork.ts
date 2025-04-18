// store/networkStore.ts
import { create } from 'zustand'
import { Network } from '@avalabs/core-chains-sdk'
import { AVALANCHE_MAINNET_NETWORK } from 'services/network/consts'
import { useCallback } from 'react'

export enum SelectedNetworkKey {
  RECEIVE = 'receive'
}

interface SelectedNetworkStore {
  selected: Record<SelectedNetworkKey, Network>
  setSelected: (key: SelectedNetworkKey, net: Network) => void
}

const useSelectedNetworkStore = create<SelectedNetworkStore>(set => ({
  selected: {
    [SelectedNetworkKey.RECEIVE]: AVALANCHE_MAINNET_NETWORK
  },
  setSelected: (key, net) =>
    set(state => ({
      selected: { ...state.selected, [key]: net }
    }))
}))

export function useSelectedNetwork(
  key: SelectedNetworkKey
): [Network | undefined, (net: Network) => void] {
  const selected = useSelectedNetworkStore(s => s.selected[key])

  const setSelected = useSelectedNetworkStore(s => s.setSelected)

  const setForKey = useCallback(
    (net: Network) => setSelected(key, net),
    [setSelected, key]
  )

  return [selected, setForKey]
}
