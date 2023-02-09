import React, { FC, useMemo } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import MarketTriangleSVG from 'components/MarketTriangleSVG'
import AvaText from 'components/AvaText'
import { WatchlistFilter } from 'screens/watchlist/types'
import { formatLargeCurrency } from 'utils/Utils'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useSelector } from 'react-redux'

interface Props {
  priceChange: number
  percentChange: number
  hideDifference?: boolean
  hidePercentage?: boolean
  hideCurrencyCode?: boolean
  filterBy?: WatchlistFilter
  testID?: string
}

const MarketMovement: FC<Props> = ({
  priceChange,
  percentChange,
  hideDifference,
  hidePercentage,
  hideCurrencyCode,
  filterBy = WatchlistFilter.PRICE
}) => {
  const theme = useApplicationContext().theme
  const { currencyFormatter } = useApplicationContext().appHook
  const selectedCurrency = useSelector(selectSelectedCurrency)

  const getDisplayChangeNumbers = useMemo(() => {
    if (priceChange === 0 && percentChange === 0) {
      return '$ -'
    }

    let formattedPrice = formatLargeCurrency(
      currencyFormatter(Math.abs(priceChange)),
      filterBy === WatchlistFilter.PRICE ? 2 : 3
    )
    if (hideCurrencyCode)
      formattedPrice = formattedPrice.replace(selectedCurrency, '')

    const formattedPercent = hideDifference
      ? `${percentChange.toFixed(2).replace('-', '')}%`
      : `(${percentChange.toFixed(2).replace('-', '')}%)`

    return `${hideDifference ? '' : formattedPrice}  ${
      hidePercentage ? '' : formattedPercent
    }`.trim()
  }, [
    priceChange,
    percentChange,
    currencyFormatter,
    filterBy,
    hideCurrencyCode,
    selectedCurrency,
    hideDifference,
    hidePercentage
  ])

  return (
    <AvaText.Caption
      textStyle={{
        color:
          priceChange === 0
            ? theme.colorText2
            : priceChange < 0
            ? theme.colorError
            : theme.colorSuccess
      }}>
      {priceChange !== 0 && <MarketTriangleSVG negative={priceChange < 0} />}{' '}
      {getDisplayChangeNumbers}
    </AvaText.Caption>
  )
}

export default MarketMovement
