import {
  useAccountsContext,
  useWalletContext,
} from '@avalabs/wallet-react-components';
import AppViewModel from 'AppViewModel';
import {Alert} from 'react-native';

interface WalletSetup {
  initWalletWithMnemonic: (mnemonic: string) => void;
  destroyWallet: () => void;
}

export function useWalletSetup(): WalletSetup {
  const walletContext = useWalletContext();
  const accountsContext = useAccountsContext();

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

  async function destroyWallet() {
    // this destroy method is actually not supported as intended currently.
    // the wallet still lives in memor :( talked to Emre and we need more methods,
    // including a 'clearMnemonic' from state context.
    walletContext?.clearMnemonic();

    await AppViewModel.immediateLogout().catch(err => Alert.alert(err.message));
  }

  return {
    initWalletWithMnemonic,
    destroyWallet,
  };
}
