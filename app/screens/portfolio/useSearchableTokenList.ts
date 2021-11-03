import {useEffect, useState} from 'react';
import {BN} from '@avalabs/avalanche-wallet-sdk';
import {
  erc20TokenList$,
  TokenWithBalance,
  useWalletStateContext,
} from '@avalabs/wallet-react-components';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {take} from 'rxjs/operators';

type ShowZeroArrayType = {[x: string]: boolean};
const bnZero = new BN(0);

export function useSearchableTokenList(hideZeroBalance = true): {
  searchText: string;
  setShowZeroBalanceList: (list: ShowZeroArrayType) => void;
  loadZeroBalanceList: () => void;
  filteredTokenList: TokenWithBalance[];
  showZeroBalanceList: ShowZeroArrayType;
  setSearchText: (value: ((prevState: string) => string) | string) => void;
  tokenList: TokenWithBalance[];
  loadTokenList: () => void;
  isRefreshing: boolean;
} {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tokenList, setTokenList] = useState([] as TokenWithBalance[]);
  const [filteredTokenList, setFilteredTokenList] = useState(
    [] as TokenWithBalance[],
  );
  const [searchText, setSearchText] = useState('');
  const [showZeroBalanceList, setZeroBalanceList] = useState<ShowZeroArrayType>(
    {
      ['init']: false,
    },
  );

  const walletState = useWalletStateContext();

  const loadZeroBalanceList = () => {
    AsyncStorage.getItem('showZeroBalanceList').then(value => {
      if (value) {
        const list: ShowZeroArrayType = JSON.parse(value);
        setZeroBalanceList({...list});
      }
    });
  };

  const setShowZeroBalanceList = (list: ShowZeroArrayType) => {
    AsyncStorage.setItem('showZeroBalanceList', JSON.stringify(list)).then(() =>
      setZeroBalanceList(list),
    );
  };

  function loadTokenList() {
    if (!walletState) {
      return; //('wallet state not available');
    }

    setIsRefreshing(true);

    erc20TokenList$.pipe(take(1)).subscribe({
      next: erc20Tokens => {
        const tokens = [
          walletState.avaxToken,
          ...erc20Tokens.filter(value => {
            return hideZeroBalance
              ? value.balance.gt(bnZero) || showZeroBalanceList[value.name]
              : true;
          }),
          ...walletState.antTokens,
        ] as TokenWithBalance[];

        setTokenList(tokens);
        setIsRefreshing(false);
      },
      error: e => {
        setIsRefreshing(false);
        console.debug('deal with error', e);
      },
      complete: () => {
        console.debug('complete');
      },
    });
  }

  useEffect(() => loadZeroBalanceList(), []);

  useEffect(() => {
    loadTokenList();
  }, [walletState, showZeroBalanceList, hideZeroBalance]);

  useEffect(() => {
    setFilteredTokenList(
      tokenList.filter(
        token =>
          token.name.toLowerCase().indexOf(searchText.toLowerCase()) !== -1,
      ),
    );
  }, [tokenList, searchText]);

  return {
    tokenList,
    filteredTokenList,
    searchText,
    setSearchText,
    setShowZeroBalanceList,
    showZeroBalanceList,
    loadZeroBalanceList,
    loadTokenList,
    isRefreshing,
  };
}
