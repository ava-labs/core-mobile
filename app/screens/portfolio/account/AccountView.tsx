import React, {useCallback} from 'react';
import {View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';
import AvaButton from 'components/AvaButton';
import {useAccountsContext} from '@avalabs/wallet-react-components';
import {Account} from 'dto/Account';
import AccountItem from 'screens/portfolio/account/AccountItem';
import {BottomSheetFlatList} from '@gorhom/bottom-sheet';

function AccountView({onDone}: {onDone: () => void}): JSX.Element {
  const {theme} = useApplicationContext();
  const {accounts, saveAccounts, setActiveAccount} =
    useApplicationContext().repo.accountsRepo;
  const accountsContext = useAccountsContext();

  const addNewAccount = useCallback(() => {
    const newAccount = accountsContext.addAccount();
    accountsContext.activateAccount(newAccount.index);
    accounts.set(newAccount.index, {
      index: newAccount.index,
      title: `Account ${newAccount.index + 1}`,
      active: true,
      address: newAccount.wallet.getAddressC(),
      balance$: newAccount.balance$,
    });
    saveAccounts(accounts);
    setActiveAccount(newAccount.index);
  }, [accounts, accountsContext, saveAccounts, setActiveAccount]);

  const onSelectAccount = (accountIndex: number) => {
    accountsContext.activateAccount(accountIndex);
    setActiveAccount(accountIndex);
  };

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: 16,
      }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <AvaText.Heading1>My accounts</AvaText.Heading1>
        <AvaButton.Base rippleBorderless onPress={onDone}>
          <AvaText.ButtonLarge textStyle={{color: theme.colorAccent}}>
            Done
          </AvaText.ButtonLarge>
        </AvaButton.Base>
      </View>
      <Space y={16} />
      <BottomSheetFlatList
        style={{marginHorizontal: -16}}
        data={[...accounts.values()]}
        renderItem={info => renderAccountItem(info.item, onSelectAccount)}
      />
      <AvaButton.PrimaryLarge onPress={addNewAccount}>
        Add Account
      </AvaButton.PrimaryLarge>
      <Space y={16} />
    </View>
  );
}

const renderAccountItem = (
  account: Account,
  onSelectAccount: (accountIndex: number) => void,
) => {
  return (
    <AccountItem
      key={account.title}
      account={account}
      editable
      selected={account.active}
      onSelectAccount={onSelectAccount}
    />
  );
};
export default AccountView;
