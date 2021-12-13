import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';
import AvaButton from 'components/AvaButton';
import AddSVG from 'components/svg/AddSVG';
import {useAccountsContext} from '@avalabs/wallet-react-components';
import {Account} from 'dto/Account';
import AccountItem from 'screens/portfolio/account/AccountItem';

function accountElements(
  accounts: Account[],
  expandedAccIndex: number,
  setExpanded: (accIndex: number) => void,
  onSelectAccount: (accountIndex: number) => void,
): Element[] {
  const elements: Element[] = [];

  accounts.forEach(account => {
    elements.push(
      <AccountItem
        key={account.title}
        account={account}
        expanded={expandedAccIndex === account.index}
        setExpanded={accIndex => setExpanded(accIndex)}
        onSelectAccount={onSelectAccount}
      />,
    );
  });
  return elements;
}

function AccountView(): JSX.Element {
  const {theme} = useApplicationContext();
  const {accounts, saveAccounts, setActiveAccount} =
    useApplicationContext().repo.accountsRepo;
  const accountsContext = useAccountsContext();
  const [expandedAccIndex, setExpandedAccIndex] = useState(0);

  useEffect(() => {
    const activeIndex = [...accounts.values()].find(
      value => value.active,
    )?.index;
    if (activeIndex) {
      setExpandedAccIndex(activeIndex);
    }
  }, []);

  const onSelectAccount = (accountIndex: number) => {
    setActiveAccount(accountIndex);
    console.log('accountsContext', accountsContext);
    accountsContext.activateAccount(accountIndex);
  };

  const addNewAccount = () => {
    const newAccount = accountsContext.addAccount();
    accountsContext.activateAccount(newAccount.index);
    accounts.set(newAccount.index, {
      index: newAccount.index,
      title: `Account ${newAccount.index + 1}`,
      active: true,
      cAddress: newAccount.wallet.getAddressC(),
      xAddress: newAccount.wallet.getAddressX(),
    });
    saveAccounts(accounts);
    setActiveAccount(newAccount.index);
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
        <AvaButton.TextWithIcon
          onPress={addNewAccount}
          gap={0}
          icon={<AddSVG color={theme.colorPrimary1} hideCircle size={32} />}
          text={
            <AvaText.ButtonLarge textStyle={{color: theme.colorPrimary1}}>
              Add new
            </AvaText.ButtonLarge>
          }
        />
      </View>
      <Space y={16} />
      {accountElements(
        [...accounts.values()],
        expandedAccIndex,
        accIndex => setExpandedAccIndex(accIndex),
        onSelectAccount,
      )}
    </View>
  );
}

export default AccountView;
