import {Assets, MnemonicWallet, Utils} from '@avalabs/avalanche-wallet-sdk';
import {ERC20Balance} from '@avalabs/avalanche-wallet-sdk/dist/Wallet/types';
import {useEffect, useState} from 'react';

export class TokenItem {
  id: string;
  title: string;
  balance: string;

  constructor(id: string, title: string, balance: string) {
    this.id = id;
    this.title = title;
    this.balance = balance;
  }
}

export function useTokenAssets(wallet: MnemonicWallet): [TokenItem[]] {
  const [tokenItems, setTokenItems] = useState<TokenItem[]>([]);

  useEffect(() => {
    getTokens().then((value: TokenItem[]) => setTokenItems(value));
  }, []);

  function getTokens(): Promise<TokenItem[]> {
    return Assets.getErc20Token('0xd00ae08403B9bbb9124bB305C09058E32C39A48c')
      .then(() => {
        return wallet.getBalanceERC20([
          '0xd00ae08403B9bbb9124bB305C09058E32C39A48c',
        ]);
      })
      .then((tokens: ERC20Balance[]) => {
        const tokenItems = [];
        for (let tokenAddress in tokens) {
          const bal: ERC20Balance = tokens[tokenAddress];
          tokenItems.push(
            new TokenItem(
              tokenAddress,
              bal.name,
              Utils.bnToAvaxC(bal.balance) + ' ' + bal.symbol,
            ),
          );
        }
        return tokenItems;
      });
  }

  return [tokenItems];
}
