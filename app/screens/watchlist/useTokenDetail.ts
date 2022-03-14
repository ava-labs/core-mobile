import {useEffect, useState} from 'react';
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

export function useTokenDetail(tokenAddress: string) {
  const {repo} = useApplicationContext();
  const [isFavorite, setIsFavorite] = useState(true);
  const [token, setToken] = useState<TokenWithBalance>();
  const {openMoonPay, openUrl} = useInAppBrowser();
  const {selectedCurrency, currencyFormatter} = useApplicationContext().appHook;
  const [chartData, setChartData] = useState<{x: number; y: number}[]>([]);
  const [ranges, setRanges] = useState<{
    minDate: number;
    maxDate: number;
    minPrice: number;
    maxPrice: number;
  }>({minDate: 0, maxDate: 0, minPrice: 0, maxPrice: 0});
  const [contractInfo, setContractInfo] = useState<CoinsContractInfoResponse>();
  const [urlHostname, setUrlHostname] = useState<string>('');
  const {watchlistFavorites, saveWatchlistFavorites} =
    repo.watchlistFavoritesRepo;
  const {filteredTokenList} = useSearchableTokenList(false);
  const walletState = useWalletStateContext();

  // find token
  useEffect(() => {
    if (filteredTokenList) {
      const tk = walletState?.erc20Tokens.find(
        tk => tk.address === tokenAddress,
        false,
      );
      if (tk) {
        setToken(tk);
      }
    }
  }, [filteredTokenList]);

  // checks if contract can be found in favorites list
  useEffect(() => {
    setIsFavorite(!!watchlistFavorites.find(value => value === tokenAddress));
  }, [watchlistFavorites]);

  // get coingecko chart data.
  useEffect(() => {
    (async () => {
      if (isERC20Token(token)) {
        const rawData = await coinsContractMarketChartRange(
          tokenAddress,
          'usd' as VsCurrencyType,
          moment().subtract('24', 'hour').unix(),
          moment().unix(),
        );
        const pd = rawData.prices.map(tu => {
          return {x: tu[0], y: tu[1]};
        });

        const dates = rawData.prices.map(value => value[0]);
        const prices = rawData.prices.map(value => value[1]);

        const minDate = Math.min(...dates);
        const maxDate = Math.max(...dates);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        setRanges({minDate, maxDate, minPrice, maxPrice});
        setChartData(pd);
      }
    })();
  }, [token]);

  // get market cap, volume, etc
  useEffect(() => {
    if (token && isERC20Token(token)) {
      (async () => {
        const rawData = await coinsContractInfo(token?.address);
        setContractInfo(rawData);
        if (contractInfo?.links?.homepage?.[0]) {
          const url = new URL(contractInfo?.links?.homepage?.[0]);
          setUrlHostname(url.hostname);
        }
      })();
    }
  }, [token]);

  // useEffect(() => {
  //   if (token && isERC20Token(token)) {
  //     const addresses = [];
  //     addresses.push(token.address);
  //     (async () => {
  //       try {
  //         const rawData = await simpleTokenPrice(addresses, [
  //           (selectedCurrency?.toLowerCase() as VsCurrencyType) ?? 'usd',
  //         ]);
  //         console.log(rawData);
  //       } catch (e) {
  //         console.error(e);
  //       }
  //     })();
  //   }
  // }, [token]);

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
  };
}
