import {useEffect, useState} from 'react';
import {BN} from '@avalabs/avalanche-wallet-sdk';
import {
  TokenWithBalance,
  updateAllBalances,
  useWalletContext,
  useWalletStateContext,
} from '@avalabs/wallet-react-components';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ShowZeroArrayType = {[x: string]: boolean};
const bnZero = new BN(0);

export function useSearchableTokenList(hideZeroBalance = true): {
  searchText: string;
  setShowZeroBalanceList: (list: ShowZeroArrayType) => void;
  loadZeroBalanceList: () => void;
  filteredTokenList?: TokenWithBalance[];
  showZeroBalanceList: ShowZeroArrayType;
  setSearchText: (value: ((prevState: string) => string) | string) => void;
  tokenList?: TokenWithBalance[];
  loadTokenList: () => void;
  loading: boolean;
} {
  const [loading, setLoading] = useState(false);
  const [tokenList, setTokenList] = useState<TokenWithBalance[]>([]);
  const [filteredTokenList, setFilteredTokenList] =
    useState<TokenWithBalance[]>();
  const [searchText, setSearchText] = useState('');
  const [showZeroBalanceList, setZeroBalanceList] = useState<ShowZeroArrayType>(
    {
      ['init']: false,
    },
  );

  const walletState = useWalletStateContext();
  const wallet = useWalletContext().wallet;

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
    if (wallet) {
      setLoading(true);
      updateAllBalances(wallet).then(() => setLoading(false));
    }
  }

  useEffect(() => loadZeroBalanceList(), []);

  useEffect(() => {
    if (!walletState) {
      return; //('wallet state not available');
    }

    const tokens = [
      walletState?.avaxToken,
      ...walletState?.erc20Tokens?.filter(value => {
        return hideZeroBalance
          ? value.balance.gt(bnZero) || showZeroBalanceList[value.name]
          : true;
      }),
      ...walletState?.antTokens,
    ] as TokenWithBalance[];

    setTokenList(tokens);
  }, [
    walletState?.erc20Tokens,
    walletState?.avaxToken,
    walletState?.antTokens,
    showZeroBalanceList,
    hideZeroBalance
  ]);

  useEffect(() => {
    if (tokenList) {
      setFilteredTokenList(
        tokenList.filter(
          token =>
            token?.name?.toLowerCase().indexOf(searchText.toLowerCase()) !== -1,
        ),
      );
    }
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
    loading,
  };
}
