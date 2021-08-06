import {BehaviorSubject, from, Observable} from 'rxjs';
import {Assets, MnemonicWallet, Utils} from '@avalabs/avalanche-wallet-sdk';
import {concatMap, map} from 'rxjs/operators';
import {ERC20Balance} from '@avalabs/avalanche-wallet-sdk/dist/Wallet/types';

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

export default class {
  wallet: BehaviorSubject<MnemonicWallet>;
  tokenItems: Observable<TokenItem[]>;

  constructor(wallet: BehaviorSubject<MnemonicWallet>) {
    this.wallet = wallet;

    this.tokenItems = from(
      Assets.getErc20Token('0xd00ae08403B9bbb9124bB305C09058E32C39A48c'),
    ).pipe(
      concatMap(() => this.wallet),
      concatMap((wallet: MnemonicWallet) =>
        wallet.getBalanceERC20(['0xd00ae08403B9bbb9124bB305C09058E32C39A48c']),
      ),
      map((tokens: ERC20Balance[]) => {
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
      }),
    );
  }
}
