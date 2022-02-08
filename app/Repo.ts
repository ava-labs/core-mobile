import {useEffect, useState} from 'react';
import {Account} from 'dto/Account';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Currently we support only one wallet, with multiple accounts.
 * If we want to support multiple wallets we need to keep track of different wallet id-s.
 */
const WALLET_ID = 'WALLET_ID';
const ADDR_BOOK = 'ADDR_BOOK_1';
const ADDR_BOOK_RECENTS = 'ADDR_BOOK_RECENTS';
const WATCHLIST_FAVORITES = 'WATCHLIST_FAVORITES';

type AccountId = number;
type UID = string;

export type Contact = {
  address: string;
  title: string;
  id: string;
};

export type Repo = {
  watchlistFavoritesRepo: {
    watchlistFavorites: string[];
    saveWatchlistFavorites: (favorites: string[]) => void;
  };
  accountsRepo: {
    accounts: Map<AccountId, Account>;
    saveAccounts: (accounts: Map<AccountId, Account>) => void;
    setActiveAccount: (accountIndex: number) => void;
  };
  addressBookRepo: {
    addressBook: Map<UID, Contact>;
    saveAddressBook: (addressBook: Map<UID, Contact>) => void;
    recentContacts: UID[];
    addToRecentContacts: (contactId: UID) => void;
  };
};

export function useRepo(): Repo {
  const [accounts, setAccounts] = useState<Map<AccountId, Account>>(new Map());
  const [addressBook, setAddressBook] = useState<Map<UID, Contact>>(new Map());
  const [recentContacts, setRecentContacts] = useState<UID[]>([]);
  const [watchlistFavorites, setWatchlistFavorites] = useState<string[]>([]);

  useEffect(() => {
    loadAccountsFromStorage().then(value => setAccounts(value));
    loadAddressBookFromStorage().then(value => setAddressBook(value));
    loadRecentContactsFromStorage().then(value => setRecentContacts(value));
    loadWatchlistFavoritesFromStorage().then(value =>
      setWatchlistFavorites(value),
    );
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

  const saveAddressBook = (addrBook: Map<UID, Contact>) => {
    setAddressBook(new Map(addrBook));
    saveAddressBookToStorage(addrBook).catch(reason => console.error(reason));
  };

  const addToRecentContacts = (contactId: UID) => {
    const newRecents = [
      contactId,
      ...recentContacts.filter(value => value !== contactId),
    ].slice(0, 9); //save max 10 recents
    setRecentContacts(newRecents);
    saveRecentContactsToStorage(newRecents).catch(reason =>
      console.error(reason),
    );
  };

  const saveWatchlistFavorites = (favorites: string[]) => {
    setWatchlistFavorites(favorites);
    saveWatchlistFavoritesToStorage(favorites).catch(reason =>
      console.error(reason),
    );
  };

  return {
    accountsRepo: {accounts, saveAccounts, setActiveAccount},
    addressBookRepo: {
      addressBook,
      saveAddressBook,
      recentContacts,
      addToRecentContacts,
    },
    watchlistFavoritesRepo: {watchlistFavorites, saveWatchlistFavorites},
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

async function loadRecentContactsFromStorage() {
  const rawRecents = await AsyncStorage.getItem(ADDR_BOOK_RECENTS);
  return rawRecents ? (JSON.parse(rawRecents) as UID[]) : ([] as UID[]);
}

async function loadWatchlistFavoritesFromStorage() {
  const favorites = await AsyncStorage.getItem(WATCHLIST_FAVORITES);
  return favorites ? (JSON.parse(favorites) as string[]) : [];
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

async function saveRecentContactsToStorage(recent: UID[]) {
  const stringifiedRecentContacts = JSON.stringify([...recent]);
  if (stringifiedRecentContacts === undefined) {
    console.error(recent);
  } else {
    await AsyncStorage.setItem(ADDR_BOOK_RECENTS, stringifiedRecentContacts);
  }
}

async function saveWatchlistFavoritesToStorage(favorites: string[]) {
  const stringifiedFavorites = JSON.stringify(favorites);
  if (stringifiedFavorites === undefined) {
    console.error(favorites);
  } else {
    await AsyncStorage.setItem(WATCHLIST_FAVORITES, stringifiedFavorites);
  }
}
