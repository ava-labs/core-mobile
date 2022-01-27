import React, {useCallback, useMemo, useState} from 'react';
import {View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';
import {Account} from 'dto/Account';
import AvaButton from 'components/AvaButton';
import InputText from 'components/InputText';
import {Row} from 'components/Row';
import CopySVG from 'components/svg/CopySVG';
import {copyToClipboard} from 'utils/DeviceTools';
import {usePortfolio} from 'screens/portfolio/usePortfolio';

type Props = {
  account: Account;
  onSelectAccount: (accountIndex: number) => void;
  editable?: boolean;
  selected?: boolean;
  blurred?: boolean;
};

function AccountItem({
  account,
  onSelectAccount,
  editable,
  selected,
  blurred,
}: Props): JSX.Element {
  const context = useApplicationContext();
  // const accContext = useAccountsContext(); // For some reason this returns empty object
  const {accounts, saveAccounts} = useApplicationContext().repo.accountsRepo;
  const {balanceTotalInUSD} = usePortfolio();
  const [editAccount, setEditAccount] = useState(false);
  const [editedAccountTitle, setEditedAccountTitle] = useState(account.title);

  const bgColor = useMemo(() => {
    if (selected) {
      return context.isDarkMode
        ? context.theme.colorBg3
        : context.theme.colorBg2;
    } else {
      return context.isDarkMode
        ? context.theme.colorBg2
        : context.theme.colorBg2;
    }
  }, [
    context.isDarkMode,
    context.theme.colorBg2,
    context.theme.colorBg3,
    selected,
  ]);

  const saveAccountTitle = useCallback(
    (newAccountName: string) => {
      setEditAccount(false);
      const accToUpdate = accounts.get(account.index);
      if (accToUpdate) {
        accToUpdate.title = newAccountName;
        saveAccounts(accounts);
      }
    },
    [account.index, accounts, saveAccounts],
  );

  const Title = useCallback(() => {
    return (
      <AvaText.Heading2 ellipsizeMode={'tail'}>
        {account.title}
      </AvaText.Heading2>
    );
  }, [account.title]);

  const EditTitle = useCallback(() => {
    return (
      <View style={{margin: -12}}>
        <InputText
          autoFocus
          text={account.title}
          onChangeText={setEditedAccountTitle}
        />
      </View>
    );
  }, [account.title]);

  const Edit = useCallback(() => {
    return (
      <AvaButton.Base
        rippleBorderless
        onPress={() => setEditAccount(!editAccount)}
        style={{paddingVertical: 4, paddingEnd: 8}}>
        <AvaText.ButtonMedium style={{color: context.theme.colorAccent}}>
          Edit
        </AvaText.ButtonMedium>
      </AvaButton.Base>
    );
  }, [context.theme.colorAccent, editAccount]);

  const Save = useCallback(() => {
    return (
      <AvaButton.Base
        rippleBorderless
        disabled={!editedAccountTitle}
        onPress={() => saveAccountTitle(editedAccountTitle)}
        style={{paddingVertical: 4, paddingEnd: 8}}>
        <AvaText.ButtonMedium style={{color: context.theme.colorAccent}}>
          Save
        </AvaText.ButtonMedium>
      </AvaButton.Base>
    );
  }, [context.theme.colorAccent, editedAccountTitle, saveAccountTitle]);

  const AddressC = useCallback(() => {
    return (
      <Row
        style={{
          alignItems: 'center',
          height: 16,
        }}>
        <AvaButton.Icon onPress={() => copyToClipboard(account.cAddress)}>
          <CopySVG size={16} />
        </AvaButton.Icon>
        <AvaText.ButtonSmall ellipsizeMode={'middle'}>
          {account.cAddress}
        </AvaText.ButtonSmall>
      </Row>
    );
  }, [account.cAddress]);

  return (
    <>
      <AvaButton.Base
        onPress={() => onSelectAccount(account.index)}
        style={[
          {
            backgroundColor: bgColor,
            padding: 16,
          },
        ]}>
        <Row>
          <View style={{flex: 1, justifyContent: 'center'}}>
            {editAccount ? <EditTitle /> : <Title />}
            {editable && (
              // For smaller touch area
              <Row>{editAccount ? <Save /> : <Edit />}</Row>
            )}
          </View>
          <View
            style={{
              width: 116,
              alignItems: 'flex-end',
            }}>
            <AddressC />
            <Space y={6} />
            <AvaText.Body3 currency>{balanceTotalInUSD}</AvaText.Body3>
          </View>
        </Row>
      </AvaButton.Base>
      {blurred && (
        <View
          style={{
            position: 'absolute',
            backgroundColor: context.theme.overlay,
            width: '100%',
            height: '100%',
          }}
        />
      )}
    </>
  );
}

export default AccountItem;
