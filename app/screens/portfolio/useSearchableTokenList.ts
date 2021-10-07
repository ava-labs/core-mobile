import {Dispatch, useEffect, useState} from 'react';
import {Utils} from '@avalabs/avalanche-wallet-sdk';
import {ERC20, useWalletStateContext} from '@avalabs/wallet-react-components';
import {AvaxToken} from 'dto/AvaxToken';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Tokens = (ERC20 | AvaxToken)[];
type ShowZeroArrayType = {};

export function useSearchableTokenList(hideZeroBalance = true): {
  searchText: string;
  filteredTokenList: (ERC20 | AvaxToken)[];
  setSearchText: (value: ((prevState: string) => string) | string) => void;
  tokenList: (ERC20 | AvaxToken)[];
  setShowZeroBalanceList: Dispatch<any>;
  showZeroBalanceList: {};
  loadZeroBalanceList: () => void;
} {
  const walletState = useWalletStateContext();
  const [tokenList, setTokenList] = useState([] as Tokens);
  const [filteredTokenList, setFilteredTokenList] = useState([] as Tokens);
  const [searchText, setSearchText] = useState('');
  const [showZeroBalanceList, setZeroBalanceList] = useState<ShowZeroArrayType>(
    {
      ['init']: false,
    },
  );

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

  useEffect(() => loadZeroBalanceList(), []);

  useEffect(() => {
    if (!walletState) {
      return;
    }
    const tokens = [] as Tokens;
    tokens.push({
      balance: walletState.balances.balanceAvaxTotal,
      name: 'Avalanche',
      symbol: 'AVAX',
      balanceParsed: Utils.bnToAvaxX(walletState.balances.balanceAvaxTotal),
    } as AvaxToken);
    if (walletState.erc20Tokens) {
      tokens.push(
        ...walletState.erc20Tokens.filter(tkn => {
          // default is to not show if balance is zero
          if (hideZeroBalance) {
            console.log(tkn.name, showZeroBalanceList[tkn.name]);
            return tkn.balanceParsed !== '0' || showZeroBalanceList[tkn.name];
          }
          return true;
        }),
      );
    }
    setTokenList(tokens);
  }, [walletState, showZeroBalanceList]);

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
  };
}
