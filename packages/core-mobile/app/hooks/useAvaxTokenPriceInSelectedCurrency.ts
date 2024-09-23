import { useNativeTokenPriceForNetwork } from 'hooks/networks/useNativeTokenPriceForNetwork'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { ChainId } from '@avalabs/core-chains-sdk'
import { useNetworks } from './networks/useNetworks'

export function useAvaxTokenPriceInSelectedCurrency(): number {
  const { getNetwork } = useNetworks()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const chainId = isDeveloperMode
    ? ChainId.AVALANCHE_TESTNET_ID
    : ChainId.AVALANCHE_MAINNET_ID
  const avaxNetwork = getNetwork(chainId)

  const { nativeTokenPrice: avaxPrice } = useNativeTokenPriceForNetwork(
    avaxNetwork,
    selectedCurrency.toLowerCase() as VsCurrencyType
  )
  return avaxPrice
}
