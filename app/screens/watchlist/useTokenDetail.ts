import {useEffect, useMemo, useState} from 'react';
import {
  isERC20Token,
  TokenWithBalance,
  useWalletStateContext,
} from '@avalabs/wallet-react-components';
import useInAppBrowser from 'hooks/useInAppBrowser';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {
  coinsContractInfo,
  CoinsContractInfoResponse,
  coinsContractMarketChart,
  coinsContractMarketChartRange,
  simpleTokenPrice,
  VsCurrencyType,
} from '@avalabs/coingecko-sdk';
import {useSearchableTokenList} from 'screens/portfolio/useSearchableTokenList';
import moment from 'moment';
import {CG_AVAX_TOKEN_ID} from 'screens/watchlist/WatchlistView';

export function useTokenDetail(tokenAddress: string) {
  const {repo} = useApplicationContext();
  const [isFavorite, setIsFavorite] = useState(true);
  const [token, setToken] = useState<TokenWithBalance>();
  const {openMoonPay, openUrl} = useInAppBrowser();
  const {selectedCurrency, currencyFormatter} = useApplicationContext().appHook;
  const [chartData, setChartData] = useState<{x: number; y: number}[]>();
  const [chartDays, setChartDays] = useState(1);
  const [ranges, setRanges] = useState<{
    minDate: number;
    maxDate: number;
    minPrice: number;
    maxPrice: number;
    diffValue: number;
    percentChange: number;
  }>({
    minDate: 0,
    maxDate: 0,
    minPrice: 0,
    maxPrice: 0,
    diffValue: 0,
    percentChange: 0,
  });
  const [contractInfo, setContractInfo] = useState<CoinsContractInfoResponse>();
  const [urlHostname, setUrlHostname] = useState<string>('');
  const {watchlistFavorites, saveWatchlistFavorites} =
    repo.watchlistFavoritesRepo;
  const {erc20Tokens, avaxToken} = useWalletStateContext();

  const allTokens = useMemo(
    () => [{...avaxToken, address: CG_AVAX_TOKEN_ID}, ...erc20Tokens],
    [erc20Tokens, avaxToken],
  );

  // find token
  useEffect(() => {
    if (allTokens) {
      const tk = allTokens.find(tk => tk.address === tokenAddress, false);
      if (tk) {
        setToken(tk);
      }
    }
  }, [allTokens]);

  // checks if contract can be found in favorites list
  useEffect(() => {
    setIsFavorite(!!watchlistFavorites.find(value => value === tokenAddress));
  }, [watchlistFavorites]);

  // get coingecko chart data.
  useEffect(() => {
    (async () => {
      const rawData = await coinsContractMarketChart({
        address: tokenAddress,
        currency: 'usd' as VsCurrencyType,
        days: chartDays,
        id: 'avalanche',
      });
      const pd = rawData.prices.map(tu => {
        return {x: tu[0], y: tu[1]};
      });

      const dates = rawData.prices.map(value => value[0]);
      const prices = rawData.prices.map(value => value[1]);

      const minDate = Math.min(...dates);
      const maxDate = Math.max(...dates);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const diffValue = prices[prices.length - 1] - prices[0];
      const average = (prices[prices.length - 1] + prices[0]) / 2;
      const percentChange = (diffValue / average) * 100;

      setRanges({
        minDate,
        maxDate,
        minPrice,
        maxPrice,
        diffValue,
        percentChange,
      });
      setChartData(pd);
    })();
  }, [token, chartDays]);

  // get market cap, volume, etc
  useEffect(() => {
    (async () => {
      const rawData = await coinsContractInfo({
        address: tokenAddress,
        id: 'avalanche',
      });
      setContractInfo(rawData);
      if (rawData?.links?.homepage?.[0]) {
        const url = rawData?.links?.homepage?.[0]
          ?.replace(/^https?:\/\//, '')
          ?.replace('www.', '');
        setUrlHostname(url);
      }
    })();
  }, [token]);

  function handleFavorite() {
    if (isFavorite) {
      const index = watchlistFavorites.indexOf(tokenAddress);
      if (index > -1) {
        watchlistFavorites.splice(index, 1);
        saveWatchlistFavorites(watchlistFavorites);
      }
    } else {
      watchlistFavorites.push(tokenAddress);
      saveWatchlistFavorites(watchlistFavorites);
    }
    setIsFavorite(!isFavorite);
  }

  function changeChartDays(days: number) {
    setChartData(undefined);
    setChartDays(days);
  }

  return {
    isFavorite,
    openMoonPay,
    openUrl,
    selectedCurrency,
    currencyFormatter,
    contractInfo,
    urlHostname,
    handleFavorite,
    marketTotalSupply: contractInfo?.market_data.total_supply ?? 0,
    twitterHandle: contractInfo?.links?.twitter_screen_name,
    marketCirculatingSupply: contractInfo?.market_data?.circulating_supply ?? 0,
    marketVolume: contractInfo?.market_data?.total_volume.usd ?? 0,
    marketCap: contractInfo?.market_data?.market_cap.usd ?? 0,
    marketCapRank: contractInfo?.market_cap_rank ?? 0,
    chartData,
    token,
    ranges,
    changeChartDays,
  };
}
