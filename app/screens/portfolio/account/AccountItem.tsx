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
import {useSelectedAccountContext} from 'contexts/SelectedAccountContext';
import {Opacity05} from 'resources/Constants';

type Props = {
  account: Account;
};

function AccountItem({account}: Props): JSX.Element {
  const context = useApplicationContext();
  const {balanceTotalInUSD} = usePortfolio();
  const [editAccount, setEditAccount] = useState(false);
  const {updateAccountName} = useSelectedAccountContext();

  function onEditAccountName(): void {
    setEditAccount(!editAccount);
  }

  function onTextEdited(newAccountName: string): void {
    updateAccountName(account.cAddress, newAccountName);
  }

  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: context.isDarkMode
            ? context.theme.white + Opacity05
            : context.theme.colorBg2,
          borderRadius: 8,
          borderWidth: context.isDarkMode ? 0 : 1,
          borderColor: context.theme.colorStroke,
          padding: 16,
          alignItems: 'center',
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
    </View>
  );
}

export default AccountItem;
