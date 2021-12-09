import React, {useState} from 'react';
import {View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';
import EditSVG from 'components/svg/EditSVG';
import AccountChainAddress from 'screens/portfolio/account/AccountChainAddress';
import {Account} from 'dto/Account';
import {usePortfolio} from 'screens/portfolio/usePortfolio';
import AvaButton from 'components/AvaButton';
import {Opacity50} from 'resources/Constants';

type Props = {
  account: Account;
  expanded: boolean;
  setExpanded: (accIndex: number) => void;
  onSelectAccount: (accountIndex: number) => void;
};

function AccountItem({
  account,
  expanded,
  setExpanded,
  onSelectAccount,
}: Props): JSX.Element {
  const context = useApplicationContext();
  // const accContext = useAccountsContext(); // For some reason this returns empty object
  const {accounts, saveAccounts} = useApplicationContext().repo.accountsRepo;
  const {balanceTotalInUSD} = usePortfolio();
  const [editAccount, setEditAccount] = useState(false);

  function onEditAccountName(): void {
    setEditAccount(!editAccount);
  }

  function onTextEdited(newAccountName: string): void {
    const accToUpdate = accounts.get(account.index);
    if (accToUpdate) {
      accToUpdate.title = newAccountName;
      saveAccounts(accounts);
    }
  }

  return (
    <>
      {!expanded && (
        <AvaButton.Base
          style={{padding: 16}}
          onPress={() => setExpanded(account.index)}>
          <AvaText.Heading2>{account.title}</AvaText.Heading2>
        </AvaButton.Base>
      )}
      {expanded && (
        <View
          style={[
            {
              backgroundColor: context.isDarkMode
                ? context.theme.colorBg3 + Opacity50
                : context.theme.colorBg2,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: context.theme.colorBg3,
              padding: 16,
            },
          ]}>
          <Space y={16} />
          <View style={{flexDirection: 'row'}}>
            <AvaButton.Base onPress={onEditAccountName}>
              <AvaText.Heading2
                onTextEdited={onTextEdited}
                editable={editAccount}
                textStyle={{height: 24, padding: 0}}>
                {account.title}
              </AvaText.Heading2>
            </AvaButton.Base>
            {!editAccount && <Space x={8} />}
            {!editAccount && (
              <AvaButton.Icon
                style={{marginTop: -14, marginLeft: -8, marginBottom: -10}}
                onPress={onEditAccountName}>
                <EditSVG />
              </AvaButton.Icon>
            )}
          </View>
          <Space y={8} />
          <AvaText.Body2>{balanceTotalInUSD} USD</AvaText.Body2>
          <Space y={32} />
          <AccountChainAddress
            address={account.cAddress}
            title={'C chain'}
            color={context.theme.colorChain2}
            bgColor={context.theme.colorChain}
          />

          <Space y={8} />
          <View style={{display: 'flex', alignSelf: 'stretch'}}>
            <AccountChainAddress
              address={account.xAddress}
              title={'X chain'}
              color={context.theme.colorChain4}
              bgColor={context.theme.colorChain3}
            />
          </View>
          {!account.active && (
            <>
              <Space y={24} />
              <AvaButton.PrimaryLarge
                onPress={() => onSelectAccount(account.index)}>
                Select
              </AvaButton.PrimaryLarge>
            </>
          )}
        </View>
      )}
    </>
  );
}

export default AccountItem;
