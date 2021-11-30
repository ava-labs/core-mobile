import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  useWalletContext,
  useWalletStateContext,
} from '@avalabs/wallet-react-components';
import {Account} from 'dto/Account';
import AsyncStorage from '@react-native-async-storage/async-storage';

type WalletId = string;
type AccountId = string;

export interface SelectedAccountContextState {
  selectedAccount: Account | undefined;
  accounts: Map<AccountId, Account>;
  setSelectedAccount: Dispatch<SetStateAction<Account | undefined>>;
  updateAccountName: (accountId: AccountId, name: string) => void;
}

export const SelectedAccountContext =
  createContext<SelectedAccountContextState>({} as any);

export const SelectedAccountContextProvider = ({children}: {children: any}) => {
  const [selectedAccount, setSelectedAccount] = useState<Account | undefined>(
    undefined,
  );
  const [accounts, setAccounts] = useState(new Map<AccountId, Account>());
  const [walletId, setWalletId] = useState('');
  const walletState = useWalletStateContext();
  const walletContext = useWalletContext();

  useEffect(() => {
    if (!walletContext || !walletContext.wallet) {
      return;
    }
    setWalletId(walletContext.wallet.getBaseAddress());
  }, [walletContext, walletContext?.wallet]);

  useEffect(() => {
    if (!walletId || !walletState) {
      return;
    }
    (async () => {
      const loadedAccounts = await loadAccountsFromStorage(walletId);
      if (loadedAccounts.size > 0) {
        setAccounts(loadedAccounts);
        setSelectedAccount([...loadedAccounts.values()][0]);
      } else {
        const defaultAccount = new Map<AccountId, Account>();
        if (walletState?.addresses?.addrC) {
          const acc = {
            title: 'Account1',
            xAddress: walletState?.addresses?.addrX,
            cAddress: walletState?.addresses?.addrC,
          } as Account;
          defaultAccount.set(walletState?.addresses?.addrC, acc);
          setSelectedAccount(acc);
        }
        setAccounts(defaultAccount);
      }
    })();
  }, [walletId, walletState?.addresses]);

  async function loadAccountsFromStorage(
    walletId: WalletId,
  ): Promise<Map<AccountId, Account>> {
    const rawAccounts = await AsyncStorage.getItem(walletId);
    return rawAccounts
      ? (new Map(JSON.parse(rawAccounts)) as Map<AccountId, Account>)
      : new Map<AccountId, Account>();
  }

  async function saveAccountsToStorage(
    walletId: WalletId,
    accToStore: Map<AccountId, Account>,
  ) {
    const stringifiedAccounts = JSON.stringify([...accToStore]);
    if (stringifiedAccounts === undefined) {
      console.error('Could not stringify accounts: ', accToStore);
    } else {
      await AsyncStorage.setItem(walletId, stringifiedAccounts);
    }
  }

  function updateAccountName(accountId: AccountId, name: string) {
    const account = accounts?.get(accountId);
    if (account) {
      account.title = name;
      setAccounts(new Map(accounts));
      saveAccountsToStorage(walletId, accounts).catch(reason => {
        console.error(reason);
      });
    }
  }

  const state: SelectedAccountContextState = {
    selectedAccount,
    accounts,
    setSelectedAccount,
    updateAccountName,
  };
  return (
    <SelectedAccountContext.Provider value={state}>
      {children}
    </SelectedAccountContext.Provider>
  );
};

export function useSelectedAccountContext() {
  return useContext(SelectedAccountContext);
}
