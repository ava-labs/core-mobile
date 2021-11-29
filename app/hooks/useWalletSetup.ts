import {
  AccountsHdCache,
  FUJI_NETWORK,
  MAINNET_NETWORK,
  setHdCache,
  setWalletHdCache,
  useAccountsContext,
  useWalletContext,
} from '@avalabs/wallet-react-components';
import {useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {iHDWalletIndex, MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';

interface WalletSetup {
  initWalletWithMnemonic: (mnemonic: string) => void;
  createNewWallet: (mnemonic: string) => void;
  destroyWallet: () => void;
  resetHDIndices: () => Promise<iHDWalletIndex>;
}

export function useWalletSetup(): WalletSetup {
  const walletContext = useWalletContext();
  const accountsContext = useAccountsContext();

  // set cache if there it one
  useEffect(() => {
    AsyncStorage.getItem('HD_CACHE').then(value => {
      if (value) {
        const cache: AccountsHdCache = JSON.parse(value);
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
   * Inits wallet with Mnemonic phrase,
   * adds account and set it as active.
   *
   * This does not yet handles the scenario of
   * multiple accounts.
   * @param mnemonic
   */
  function initWalletWithMnemonic(mnemonic: string) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    walletContext.setMnemonic(mnemonic).then(() => {
      accountsContext.addAccount();
      accountsContext.activateAccount(0);
    });
  }

  /**
   * Create new wallet, set cache immediately so we don't have to wait for derivations.
   * Adds account and set it as active.
   *
   * This does not yet handles the scenario of
   * multiple accounts.
   * @param mnemonic
   */
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

  /**
   * Destroys the wallet instance
   */
  async function destroyWallet() {
    walletContext?.clearMnemonic();
  }

  async function resetHDIndices() {
    return (walletContext?.wallet as MnemonicWallet)?.resetHdIndices();
  }

  return {
    initWalletWithMnemonic,
    createNewWallet,
    destroyWallet,
    resetHDIndices,
  };
}
