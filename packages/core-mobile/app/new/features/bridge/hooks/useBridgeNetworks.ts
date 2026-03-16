import { Network } from '@avalabs/core-chains-sdk'
import { BridgeAsset } from '@avalabs/bridge-unified'
import { useNetworks } from 'hooks/networks/useNetworks'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'
import { useMemo } from 'react'
import { sortPrimaryNetworks } from 'common/utils/sortPrimaryNetworks'
import { useSelector } from 'react-redux'
import {
  selectIsBridgeBtcBlocked,
  selectIsBridgeEthBlocked
} from 'store/posthog'
import { isEthereumChainId } from 'services/network/utils/isEthereumNetwork'
import { isBitcoinChainId } from 'utils/network/isBitcoinNetwork'
import { useBridgeAssetMap } from './useBridgeAssets'

export const useBridgeSourceNetworks = (): Network[] => {
  const chainAssetMap = useBridgeAssetMap()
  const isBridgeBtcBlocked = useSelector(selectIsBridgeBtcBlocked)
  const isBridgeEthBlocked = useSelector(selectIsBridgeEthBlocked)

  const networks = useNetworksFromCaip2ChainIds(
    Object.keys(chainAssetMap ?? [])
  )

  return useMemo(() => {
    let sourceNetworks = networks.toSorted(sortPrimaryNetworks)

    if (isBridgeBtcBlocked) {
      sourceNetworks = sourceNetworks.filter(
        network => !isBitcoinChainId(network.chainId)
      )
    }

    if (isBridgeEthBlocked) {
      sourceNetworks = sourceNetworks.filter(
        network => !isEthereumChainId(network.chainId)
      )
    }

    return sourceNetworks
  }, [networks, isBridgeBtcBlocked, isBridgeEthBlocked])
}

export const useBridgeTargetNetworks = (
  selectedBridgeAsset: BridgeAsset | undefined
): Network[] => {
  const isBridgeBtcBlocked = useSelector(selectIsBridgeBtcBlocked)
  const isBridgeEthBlocked = useSelector(selectIsBridgeEthBlocked)

  const networks = useNetworksFromCaip2ChainIds(
    Object.keys(selectedBridgeAsset?.destinations ?? [])
  )

  return useMemo(() => {
    let targetNetworks = networks
    if (isBridgeBtcBlocked) {
      targetNetworks = targetNetworks.filter(
        network => !isBitcoinChainId(network.chainId)
      )
    }

    if (isBridgeEthBlocked) {
      targetNetworks = targetNetworks.filter(
        network => !isEthereumChainId(network.chainId)
      )
    }

    return targetNetworks
  }, [networks, isBridgeBtcBlocked, isBridgeEthBlocked])
}

export const useNetworksFromCaip2ChainIds = (
  caip2ChainIds: string[]
): Network[] => {
  const { networks } = useNetworks()

  return caip2ChainIds
    .map(caip2ChainId => getChainIdFromCaip2(caip2ChainId))
    .filter((chainId): chainId is number => !!chainId)
    .map(chainId => networks[chainId])
    .filter((network): network is Network => !!network)
}
