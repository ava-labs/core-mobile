import {useEffect, useState, useMemo } from 'react';
import {BN} from '@avalabs/avalanche-wallet-sdk';
import {
  TokenWithBalance,
  updateAllBalances,
  useNetworkContext,
  useWalletContext,
  useWalletStateContext,
} from '@avalabs/wallet-react-components';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getTokenUID} from 'utils/TokenTools';
import {useApplicationContext} from 'contexts/ApplicationContext';

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
  const walletState = useWalletStateContext();
  const wallet = useWalletContext().wallet;
  const network = useNetworkContext()?.network;
  const {loadTokensCache, saveTokensCache} =
    useApplicationContext().repo.portfolioTokensCache;
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<Map<string, TokenWithBalance>>(new Map<string, TokenWithBalance>())

  const tokenList = useMemo(()=> Array.from(tokens.values()).sort((a, b) => {
    if (a.isAvax && b.isAvax) {
      return 0;
    } else if (a.isAvax) {
      return -1;
    } else {
      return 1;
    }
  }), [tokens])

  const [filteredTokenList, setFilteredTokenList] = useState<
    TokenWithBalance[]
  >([]);
  const [searchText, setSearchText] = useState('');
  const [showZeroBalanceList, setZeroBalanceList] = useState<ShowZeroArrayType>(
    {
      ['init']: false,
    },
  );
  const [isLoadingCache, setIsLoadingCache] = useState(true);

  useEffect(loadZeroBalanceList, []);
  useEffect(initTokensFromCache, [network]);
  useEffect(setAvaxToken, [walletState?.avaxToken, isLoadingCache]);
  useEffect(setErc20Tokens, [walletState?.erc20Tokens, isLoadingCache]);
  useEffect(filterTokensBySearchText, [tokenList, searchText]);
  useEffect(saveTokens,[tokens, network, isLoadingCache])

  function saveTokens(){
    if (!isLoadingCache && network) {
      saveTokensCache(network.name, tokens);
    }
  }

  function initTokensFromCache() {
    if (!network) {
      return;
    }
    loadTokensCache(network.name).then(value => {
      setTokens(new Map(value))
      setIsLoadingCache(false);
    });
  }

  function setAvaxToken() {
    if (!walletState || isLoadingCache) {
      return;
    }

    const avaxUid = getTokenUID(walletState.avaxToken);

    if (avaxUid === '0') {
      return; //sometimes walletState.avaxToken is empty object
    }
   
    setTokens(currentTokens => new Map(currentTokens.set(avaxUid, walletState.avaxToken)))
  }

  function setErc20Tokens() {
    if (isLoadingCache) {
      return;
    }
    
    let erc20Tokens = new Map<string, TokenWithBalance>()
    
    walletState?.erc20Tokens?.forEach(value => {
      const tokenUID = getTokenUID(value);
      if (
        !hideZeroBalance ||
        (hideZeroBalance &&
          (value.balance.gt(bnZero) || showZeroBalanceList[tokenUID]))
      ) {
        erc20Tokens.set(tokenUID, value)
      }
    });

    if (erc20Tokens.size > 0){
      setTokens(currentTokens => new Map([...currentTokens, ...erc20Tokens]))
    }
  }

  function loadTokenList() {
    if (wallet) {
      setLoading(true);
      updateAllBalances(wallet).then(() => setLoading(false));
    }
  }

  function loadZeroBalanceList() {
    AsyncStorage.getItem('showZeroBalanceList.v2').then(value => {
      if (value) {
        const list: ShowZeroArrayType = JSON.parse(value);
        setZeroBalanceList({...list});
      }
    });
  }

  const setShowZeroBalanceList = (list: ShowZeroArrayType) => {
    AsyncStorage.setItem('showZeroBalanceList.v2', JSON.stringify(list)).then(
      () => setZeroBalanceList(list),
    );
  };

  function filterTokensBySearchText() {
    if (tokenList) {
      const regExp = new RegExp(searchText, 'i');
      setFilteredTokenList(
        tokenList.filter(
          token =>
            (token.name && token.name.search(regExp) !== -1) ||
            (token.symbol && token.symbol.search(regExp) !== -1),
        ),
      );
    }
  }

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
