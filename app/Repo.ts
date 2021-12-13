import {useEffect, useState} from 'react';
import {Account} from 'dto/Account';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Currently we support only one wallet, with multiple accounts.
 * If we want to support multiple wallets we need to keep track of different wallet id-s.
 */
const WALLET_ID = 'WALLET_ID';

type AccountId = number;

export type Repo = {
  accountsRepo: {
    accounts: Map<AccountId, Account>;
    saveAccounts: (accounts: Map<AccountId, Account>) => void;
    setActiveAccount: (accountIndex: number) => void;
  };
};

export function useRepo(): Repo {
  const [accounts, setAccounts] = useState<Map<AccountId, Account>>(new Map());

  useEffect(() => {
    loadAccountsFromStorage().then(value => {
      setAccounts(value);
    });
  }, []);

  const saveAccounts = (accounts: Map<AccountId, Account>) => {
    setAccounts(new Map(accounts));
    saveAccountsToStorage(WALLET_ID, accounts).catch(reason =>
      console.error(reason),
    );
  };

  const setActiveAccount = (accountIndex: number) => {
    accounts.forEach(acc => (acc.active = acc.index === accountIndex));
    saveAccounts(accounts);
  };

  return {
    accountsRepo: {accounts, saveAccounts, setActiveAccount},
  };
}

async function loadAccountsFromStorage() {
  const rawAccounts = await AsyncStorage.getItem(WALLET_ID);
  return rawAccounts
    ? (new Map(JSON.parse(rawAccounts)) as Map<AccountId, Account>)
    : new Map<AccountId, Account>();
}

async function saveAccountsToStorage(
  walletId: string,
  accToStore: Map<AccountId, Account>,
) {
  const stringifiedAccounts = JSON.stringify([...accToStore]);
  if (stringifiedAccounts === undefined) {
    console.error('Could not stringify accounts: ', accToStore);
  } else {
    await AsyncStorage.setItem(walletId, stringifiedAccounts);
  }
}
