import React, {useContext} from 'react';
import {View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';
import EditSVG from 'components/svg/EditSVG';
import AccountChainAddress from 'screens/portfolio/account/AccountChainAddress';
import {Account} from 'dto/Account';

type Props = {
  account: Account;
};

function AccountItem({account}: Props): JSX.Element {
  const context = useContext(ApplicationContext);

  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: context.theme.colorBg2,
          borderRadius: 8,
          padding: 16,
          alignItems: 'center',
        },
        context.shadow,
      ]}>
      <Space y={16} />
      <View style={{flexDirection: 'row'}}>
        <AvaText.Heading2>{account.title}</AvaText.Heading2>
        <Space x={8} />
        <EditSVG />
      </View>
      <Space y={8} />
      <AvaText.Body2>$980,345.11 USD</AvaText.Body2>
      <Space y={32} />
      <AccountChainAddress
        address={account.cAddress}
        title={'C chain'}
        color={context.theme.ovalBgGreen}
      />

      <Space y={8} />
      <View style={{display: 'flex', alignSelf: 'stretch'}}>
        <AccountChainAddress
          address={account.xAddress}
          title={'X chain'}
          color={context.theme.ovalBgBlue}
        />
      </View>
    </View>
  );
}

export default AccountItem;
