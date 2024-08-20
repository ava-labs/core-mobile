import { ChainId } from '@avalabs/core-chains-sdk'
import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useNativeTokenPriceForNetwork } from 'hooks/networks/useNativeTokenPriceForNetwork'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectSelectedCurrency } from 'store/settings/currency'
import { Avax } from 'types/Avax'

const roundPrecision = 4

type StringToAvax = (value: string | undefined) => Avax

type ValidParams = StringToAvax | undefined

type AvaxFormatter = (
  value: Avax | undefined | bigint,
  rounded?: boolean
) => [string, string]

type StringFormatter = (
  value: string | undefined,
  rounded?: boolean
) => [string, string]

type Formatter<T> = T extends StringToAvax
  ? StringFormatter
  : T extends undefined
  ? AvaxFormatter
  : never

export const createAvaxFormatterHook =
  <T extends ValidParams>(stringToAvax: T) =>
  // eslint-disable-next-line sonarjs/cognitive-complexity
  (): Formatter<T> => {
    const {
      appHook: { tokenInCurrencyFormatter }
    } = useApplicationContext()
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

    const formatter = (
      value: string | undefined | Avax | bigint,
      rounded = false
    ): [string, string] => {
      let baseAvax = Avax.fromBase(0)

      // convert to Avax object if necessary
      if (!(value instanceof Avax) && typeof value !== 'bigint') {
        if (stringToAvax) baseAvax = stringToAvax(value)
      } else {
        baseAvax = value instanceof Avax ? value : Avax.fromNanoAvax(value)
      }

      // format Avax amount
      const formattedAmountInAvax = rounded
        ? baseAvax.toDisplay(roundPrecision)
        : baseAvax.toString()

      // calculate + format value in currency
      const amountInCurrency = rounded
        ? baseAvax.mul(avaxPrice ?? 0).toDisplay(roundPrecision)
        : baseAvax.mul(avaxPrice ?? 0).toString()

      const formattedAmountInCurrency = `${tokenInCurrencyFormatter(
        amountInCurrency
      )} ${selectedCurrency}`

      return [formattedAmountInAvax, formattedAmountInCurrency]
    }

    return formatter as Formatter<T>
  }
