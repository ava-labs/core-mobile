import React, {FC, useMemo} from 'react'
import {useApplicationContext} from 'contexts/ApplicationContext'
import MarketTriangleSVG from 'components/MarketTriangleSVG'
import AvaText from 'components/AvaText'
import {WatchlistFilter} from 'screens/watchlist/WatchlistView'

interface Props {
  priceChange: number
  percentChange: number
  hideDifference?: boolean
  hidePercentage?: boolean
  filterBy?: WatchlistFilter
}

const MarketMovement: FC<Props> = ({
  priceChange,
  percentChange,
  hideDifference,
  hidePercentage,
  filterBy = WatchlistFilter.PRICE
}) => {
  const theme = useApplicationContext().theme
  const {currencyFormatter} = useApplicationContext().appHook

  const getDisplayChangeNumbers = useMemo(() => {
    if (priceChange === 0 && percentChange === 0) {
      return '$ -'
    }

    const formattedPrice = (
      filterBy === WatchlistFilter.PRICE
        ? currencyFormatter(priceChange)
        : currencyFormatter(priceChange, 3)
    ).replace('-', '')

    const formattedPercent = hideDifference
      ? `${percentChange.toFixed(2).replace('-', '')}%`
      : `(${percentChange.toFixed(2).replace('-', '')}%)`

    return `${hideDifference ? '' : formattedPrice}  ${
      hidePercentage ? '' : formattedPercent
    }`.trim()
  }, [priceChange, percentChange, filterBy, hideDifference, hidePercentage])

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
