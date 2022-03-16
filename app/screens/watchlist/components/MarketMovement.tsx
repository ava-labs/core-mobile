import React, {FC, useMemo} from 'react';
import {useApplicationContext} from 'contexts/ApplicationContext';
import MarketTriangleSVG from 'components/MarketTriangleSVG';
import AvaText from 'components/AvaText';
import {WatchlistFilter} from 'screens/watchlist/WatchlistView';
import {largeCurrencyFormatter} from 'utils/Utils';

interface Props {
  priceChange: number;
  percentChange: number;
  filterBy?: WatchlistFilter;
}

const MarketMovement: FC<Props> = ({
  priceChange,
  percentChange,
  filterBy = WatchlistFilter.PRICE,
}) => {
  const theme = useApplicationContext().theme;
  const {currencyFormatter} = useApplicationContext().appHook;

  const getDisplayChangeNumbers = useMemo(() => {
    if (priceChange === 0 && percentChange === 0) {
      return '$ -';
    }

    const formattedPrice = (
      filterBy === WatchlistFilter.PRICE
        ? priceChange > 0 && priceChange < 0.1
          ? `$${priceChange.toFixed(6)}`
          : currencyFormatter(priceChange)
        : largeCurrencyFormatter(priceChange, 3)
    ).replace('-', '');

    const formattedPercent = percentChange.toFixed(2).replace('-', '');

    return `${formattedPrice} (${formattedPercent})%`;
  }, [priceChange, percentChange]);

  return (
    <AvaText.Caption
      textStyle={{
        color:
          priceChange === 0
            ? theme.colorText2
            : priceChange < 0
            ? theme.colorError
            : theme.colorSuccess,
      }}>
      {priceChange !== 0 && <MarketTriangleSVG negative={priceChange < 0} />}{' '}
      {getDisplayChangeNumbers}
    </AvaText.Caption>
  );
};

export default MarketMovement;
