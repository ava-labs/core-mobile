import {useEffect, useState} from 'react';
import {Account} from 'dto/Account';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {CustomTokens} from 'screens/tokenManagement/hooks/useAddCustomToken';

/**
 * Currently we support only one wallet, with multiple accounts.
 * If we want to support multiple wallets we need to keep track of different wallet id-s.
 */
const WALLET_ID = 'WALLET_ID';
const ADDR_BOOK = 'ADDR_BOOK_1';
const ADDR_BOOK_RECENTS = 'ADDR_BOOK_RECENTS_1';
const WATCHLIST_FAVORITES = 'WATCHLIST_FAVORITES';
const CUSTOM_TOKENS = 'CUSTOM_TOKENS';

export type AccountId = number;
export type UID = string;

export type Contact = {
  address: string;
  title: string;
  id: string;
};

export type RecentContact = {
  id: AccountId | UID;
  type: 'account' | 'address';
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
    recentContacts: RecentContact[];
    addToRecentContacts: (contact: RecentContact) => void;
  };
  customTokenRepo: {
    customTokens: CustomTokens;
    saveCustomTokens: (customTokens: CustomTokens) => Promise<void>;
  };
  destroy: () => void;
};

export function useRepo(): Repo {
  const [accounts, setAccounts] = useState<Map<AccountId, Account>>(new Map());
  const [addressBook, setAddressBook] = useState<Map<UID, Contact>>(new Map());
  const [recentContacts, setRecentContacts] = useState<RecentContact[]>([]);
  const [watchlistFavorites, setWatchlistFavorites] = useState<string[]>([]);
  const [customTokens, setCustomTokens] = useState<CustomTokens>({});

  useEffect(() => {
    loadAccountsFromStorage().then(value => setAccounts(value));
    loadAddressBookFromStorage().then(value => setAddressBook(value));
    loadRecentContactsFromStorage().then(value => setRecentContacts(value));
    loadWatchlistFavoritesFromStorage().then(value =>
      setWatchlistFavorites(value),
    );
    loadCustomTokensFromStorage().then(value => setCustomTokens(value));
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

  const saveCustomTokens = (tokens: CustomTokens) => {
    setCustomTokens(tokens);
    return saveCustomTokensToStorage(tokens);
  };

  const addToRecentContacts = (contact: RecentContact) => {
    const newRecents = [
      contact,
      ...recentContacts.filter(value => value.id !== contact.id),
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

  const destroy = () => {
    console.log('destroy repo');
    setAccounts(new Map());
    setAddressBook(new Map());
    setRecentContacts([]);
    setWatchlistFavorites([]);
    setCustomTokens({});
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
    customTokenRepo: {customTokens, saveCustomTokens},
    destroy,
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

async function loadCustomTokensFromStorage() {
  const tokenString = await AsyncStorage.getItem(CUSTOM_TOKENS);
  return tokenString ? (JSON.parse(tokenString) as CustomTokens) : {};
}

async function loadRecentContactsFromStorage() {
  const rawRecents = await AsyncStorage.getItem(ADDR_BOOK_RECENTS);
  return rawRecents
    ? (JSON.parse(rawRecents) as RecentContact[])
    : ([] as RecentContact[]);
}

async function loadWatchlistFavoritesFromStorage() {
  const favorites = await AsyncStorage.getItem(WATCHLIST_FAVORITES);
  return favorites ? (JSON.parse(favorites) as string[]) : [];
}

const omitBalance = (key: string, value: any) => {
  if (key === 'balance$') {
    return undefined;
  } else {
    return value;
  }
};
async function saveAccountsToStorage(
  walletId: string,
  accToStore: Map<AccountId, Account>,
) {
  const stringifiedAccounts = JSON.stringify([...accToStore], omitBalance);
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

async function saveCustomTokensToStorage(tokens: CustomTokens) {
  const tokensString = JSON.stringify(tokens);
  if (tokensString === undefined) {
    console.error(tokens);
  } else {
    await AsyncStorage.setItem(CUSTOM_TOKENS, tokensString);
  }
}

async function saveRecentContactsToStorage(recent: RecentContact[]) {
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
