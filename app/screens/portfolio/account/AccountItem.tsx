import React, {useState} from 'react';
import {Pressable, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';
import EditSVG from 'components/svg/EditSVG';
import AccountChainAddress from 'screens/portfolio/account/AccountChainAddress';
import {Account} from 'dto/Account';
import {usePortfolio} from 'screens/portfolio/usePortfolio';
import AvaButton from 'components/AvaButton';
import {Opacity50} from 'resources/Constants';
import CollapsibleSection from 'components/CollapsibleSection';
import InputText from 'components/InputText';
import FlexSpacer from 'components/FlexSpacer';

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
    setEditAccount(false);
    const accToUpdate = accounts.get(account.index);
    if (accToUpdate) {
      accToUpdate.title = newAccountName;
      saveAccounts(accounts);
    }
  }

  function Title() {
    return (
      <View
        style={{flexDirection: 'row', paddingVertical: 16, marginBottom: 14}}>
        <AvaText.Heading2
          onTextEdited={onTextEdited}
          editable={editAccount}
          textStyle={{height: 24, padding: 0}}>
          {account.title}
        </AvaText.Heading2>
        <FlexSpacer />
        <AvaButton.Icon
          style={{marginTop: -14, marginLeft: -8, marginBottom: -10}}
          onPress={onEditAccountName}>
          <EditSVG />
        </AvaButton.Icon>
      </View>
    );
  }

  return (
    <>
      <CollapsibleSection
        onExpandedChange={isExpanded => {
          console.log('ex', isExpanded);
          if (isExpanded) {
            setExpanded(account.index);
          } else {
            setEditAccount(false);
          }
        }}
        startExpanded={expanded}
        title={
          expanded || (
            <View style={{padding: 16}}>
              <AvaText.Heading2>{account.title}</AvaText.Heading2>
            </View>
          )
        }>
        <Pressable
          onPress={() => setEditAccount(false)}
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
          <AvaButton.Base onPress={onEditAccountName}>
            {editAccount ? (
              <View style={{marginTop: -8, marginHorizontal: -8}}>
                <InputText
                  text={account.title}
                  autoFocus
                  mode={'confirmEntry'}
                  onConfirm={text => onTextEdited(text)}
                />
              </View>
            ) : (
              <Title />
            )}
          </AvaButton.Base>
          <AvaText.Body2 currency>{balanceTotalInUSD}</AvaText.Body2>
          <Space y={16} />
          <AccountChainAddress
            address={account.cAddress}
            title={'C chain'}
            color={context.theme.colorChain2}
            addressColor={context.theme.colorChain2}
            bgColor={context.theme.colorChain}
          />
          {!account.active && (
            <>
              <Space y={24} />
              <AvaButton.PrimaryLarge
                onPress={() => onSelectAccount(account.index)}>
                Select
              </AvaButton.PrimaryLarge>
            </>
          )}
        </Pressable>
      </CollapsibleSection>
    </>
  );
}

export default AccountItem;
