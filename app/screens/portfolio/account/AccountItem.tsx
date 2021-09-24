import React, {useContext} from 'react';
import {View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import AvaText from 'components/AvaText';
import Divider from 'components/Divider';
import EditSVG from 'components/svg/EditSVG';
import HeaderProgress from 'screens/mainView/HeaderProgress';
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
          backgroundColor: context.theme.bgOnBgApp,
          borderRadius: 8,
          padding: 16,
          alignItems: 'center',
        },
        context.shadow,
      ]}>
      <Divider size={16} />
      <View style={{flexDirection: 'row'}}>
        <AvaText.Heading2>{account.title}</AvaText.Heading2>
        <Divider size={8} />
        <EditSVG />
      </View>
      <Divider size={8} />
      <AvaText.Body2>$980,345.11 USD</AvaText.Body2>
      <Divider size={32} />
      <AccountChainAddress
        address={account.cAddress}
        title={'C chain'}
        color={context.theme.ovalBgGreen}
      />

      <Divider size={8} />
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
