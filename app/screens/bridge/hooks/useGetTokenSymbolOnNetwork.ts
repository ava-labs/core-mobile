import {useCallback} from 'react'
import {
  AssetType,
  Blockchain,
  useAssets,
  useBridgeSDK
} from '@avalabs/bridge-sdk'

export function useGetTokenSymbolOnNetwork() {
  const {currentBlockchain} = useBridgeSDK()
  const assets = useAssets(currentBlockchain)

  const getTokenSymbolOnNetwork = useCallback(
    (symbol: string, network: Blockchain) => {
      const tokenInfo = assets[symbol]
      let displaySymbol = symbol

      if (!tokenInfo || network === tokenInfo.nativeNetwork) {
        return displaySymbol
      }

      if (tokenInfo.assetType === AssetType.NATIVE) {
        displaySymbol = tokenInfo.wrappedAssetSymbol
      }

      if (tokenInfo.nativeNetwork === Blockchain.ETHEREUM) {
        return `${displaySymbol}.e`
      } else if (tokenInfo.nativeNetwork === Blockchain.AVALANCHE) {
        return `${displaySymbol}.a`
      }

      return displaySymbol
    },
    [assets]
  )

  return {getTokenSymbolOnNetwork}
}
