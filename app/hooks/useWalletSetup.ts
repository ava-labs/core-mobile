import {
  FUJI_NETWORK,
  MAINNET_NETWORK,
  NetworksHdCache,
  setHdCache,
  setWalletHdCache,
  useAccountsContext,
  useWalletContext,
} from '@avalabs/wallet-react-components';
import {useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WalletSetup {
  initWalletWithMnemonic: (mnemonic: string) => void;
  createNewWallet: (mnemonic: string) => void;
  destroyWallet: () => void;
}

export function useWalletSetup(): WalletSetup {
  const walletContext = useWalletContext();
  const accountsContext = useAccountsContext();

  // set cache if there it one
  useEffect(() => {
    AsyncStorage.getItem('HD_CACHE').then(value => {
      if (value) {
        const cache: NetworksHdCache = JSON.parse(value);
        setHdCache(cache);
      }
    });
  }, []);

  // save cache
  useEffect(() => {
    // persist HDCache JSON
    // check if empty
    if (accountsContext?.hdCache) {
      AsyncStorage.setItem('HD_CACHE', JSON.stringify(accountsContext.hdCache));
    }
  }, [accountsContext.hdCache]);
  /**
   * Inists wallet with Mnemonic phrase,
   * adds account at set it as active.
   *
   * This does not yet handles the scenario of
   * multiple accounts.
   * @param mnemonic
   */
  function initWalletWithMnemonic(mnemonic: string) {
    // setMnemonic should be an async call, because
    // accountsContext.addAccount() can only be called after the
    // mnemonic has been set.
    walletContext.setMnemonic(mnemonic);

    // for this reason we add a small delay between calls.
    setTimeout(() => {
      accountsContext.addAccount();
      accountsContext.activateAccount(0);

      // For multiple accounts we'll need to keep
      // the meta data on and how many accounts we'll need
      // to be added and which one was active.
    }, 1000);
  }

  function createNewWallet(mnemonic: string) {
    // setMnemonic should be an async call, because
    // accountsContext.addAccount() can only be called after the
    // mnemonic has been set.
    walletContext.setMnemonic(mnemonic);

    // for this reason we add a small delay between calls.
    setTimeout(() => {
      const account = accountsContext.addAccount();
      setWalletHdCache(account.wallet, MAINNET_NETWORK.config, 0, 0);
      setWalletHdCache(account.wallet, FUJI_NETWORK.config, 0, 0);
      accountsContext.activateAccount(0);

      // For multiple accounts we'll need to keep
      // the meta data on and how many accounts we'll need
      // to be added and which one was active.
    }, 1000);
  }

  async function destroyWallet() {
    // this destroy method is actually not supported as intended currently.
    // the wallet still lives in memor :( talked to Emre and we need more methods,
    // including a 'clearMnemonic' from state context.
    walletContext?.clearMnemonic();
  }

  return {
    initWalletWithMnemonic,
    createNewWallet,
    destroyWallet,
  };
}
