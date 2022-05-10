import { useState } from 'react'

export function useNetworksRepo() {
  const [networks, setNetworks] = useState({} as NetworksCollection)

  function setFavorite(network: Network) {
    setNetworks(prevState => {
      prevState[network.name].isFavorite = true
      return { ...prevState }
    })
  }

  function unsetFavorite(network: Network) {
    setNetworks(prevState => {
      prevState[network.name].isFavorite = false
      return { ...prevState }
    })
  }

  return {
    networks,
    setNetworks,
    setFavorite,
    unsetFavorite
  }
}

export type NetworksCollection = { [networkName: string]: Network }

export type Network = {
  name: string
  rpcUrl: string
  chainId: string
  nativeToken: string
  isFavorite: boolean
  isTest: boolean
  explorerUrl?: string
}
