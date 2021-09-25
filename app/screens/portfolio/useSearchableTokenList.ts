import {useEffect, useState} from 'react';
import {Utils} from '@avalabs/avalanche-wallet-sdk';
import {ERC20, useWalletStateContext} from '@avalabs/wallet-react-components';
import {AvaxToken} from 'dto/AvaxToken';

type Tokens = (ERC20 | AvaxToken)[];

export function useSearchableTokenList(): {
  searchText: string;
  filteredTokenList: (ERC20 | AvaxToken)[];
  setSearchText: (value: ((prevState: string) => string) | string) => void;
  tokenList: (ERC20 | AvaxToken)[];
} {
  const walletState = useWalletStateContext();
  const [tokenList, setTokenList] = useState([] as Tokens);
  const [filteredTokenList, setFilteredTokenList] = useState([] as Tokens);
  const [searchText, setSearchText] = useState('');

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
      tokens.push(...walletState.erc20Tokens);
    }
    setTokenList(tokens);
  }, [walletState]);

  useEffect(() => {
    setFilteredTokenList(
      tokenList.filter(
        token =>
          token.name.toLowerCase().indexOf(searchText.toLowerCase()) !== -1,
      ),
    );
  }, [tokenList, searchText]);

  return {tokenList, filteredTokenList, searchText, setSearchText};
}
