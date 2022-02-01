import {useEffect, useState} from 'react';
import {Account} from 'dto/Account';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Currently we support only one wallet, with multiple accounts.
 * If we want to support multiple wallets we need to keep track of different wallet id-s.
 */
const WALLET_ID = 'WALLET_ID';
const ADDR_BOOK = 'ADDR_BOOK_1';

type AccountId = number;
type UID = string;

export type Contact = {
  address: string;
  title: string;
  id: string;
};

export type Repo = {
  accountsRepo: {
    accounts: Map<AccountId, Account>;
    saveAccounts: (accounts: Map<AccountId, Account>) => void;
    setActiveAccount: (accountIndex: number) => void;
  };
  addressBookRepo: {
    addressBook: Map<UID, Contact>;
    saveAddressBook: (addressBook: Map<UID, Contact>) => void;
  };
};

export function useRepo(): Repo {
  const [accounts, setAccounts] = useState<Map<AccountId, Account>>(new Map());
  const [addressBook, setAddressBook] = useState<Map<UID, Contact>>(new Map());

  useEffect(() => {
    loadAccountsFromStorage().then(value => setAccounts(value));
    loadAddressBookFromStorage().then(value => setAddressBook(value));
  }, []);

  const saveAccounts = (accounts: Map<AccountId, Account>) => {
    setAccounts(new Map(accounts));
    saveAccountsToStorage(WALLET_ID, accounts).catch(reason => console.error());
  };

  const setActiveAccount = (accountIndex: number) => {
    accounts.forEach(acc => (acc.active = acc.index === accountIndex));
    saveAccounts(accounts);
  };

  const saveAddressBook = (addrBook: Map<UID, Contact>) => {
    setAddressBook(new Map(addrBook));
    saveAddressBookToStorage(addrBook).catch(reason => console.error());
  };

  return {
    accountsRepo: {accounts, saveAccounts, setActiveAccount},
    addressBookRepo: {addressBook, saveAddressBook},
  };
}

async function loadAccountsFromStorage() {
  const rawAccounts = await AsyncStorage.getItem(WALLET_ID);
  return rawAccounts
    ? (new Map(JSON.parse(rawAccounts)) as Map<AccountId, Account>)
    : new Map<AccountId, Account>();
}

async function loadAddressBookFromStorage() {
  const rawAddrBook = await AsyncStorage.getItem(ADDR_BOOK);
  return rawAddrBook
    ? (new Map(JSON.parse(rawAddrBook)) as Map<UID, Contact>)
    : new Map<UID, Contact>();
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

async function saveAddressBookToStorage(addrBook: Map<UID, Contact>) {
  const stringifiedAddrBook = JSON.stringify([...addrBook]);
  if (stringifiedAddrBook === undefined) {
    console.error(addrBook);
  } else {
    await AsyncStorage.setItem(ADDR_BOOK, stringifiedAddrBook);
  }
}
