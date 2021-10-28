import React, {useContext} from 'react';
import {View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import AvaText from 'components/AvaText';
import SendHeader from 'screens/portfolio/sendBottomSheet/SendHeader';
import TabViewAva from 'components/TabViewAva';
import ReceiveToken from 'screens/receive/ReceiveToken';
import {TokenWithBalance} from '@avalabs/wallet-react-components';
import {SelectedTokenContext, TokenType} from 'contexts/SelectedTokenContext';
import SendAvax from 'screens/sendAvax/SendAvax';
import SendERC20 from 'screens/sendERC20/SendERC20';
import SendANT from 'screens/sendANT/SendANT';

type Props = {
  onClose: () => void;
};

export default function HeaderAndTabs({onClose}: Props): JSX.Element {
  const {theme} = useContext(ApplicationContext);
  const {selectedToken, tokenType} = useContext(SelectedTokenContext);

  const renderCustomLabel = (title: string, focused: boolean) => {
    return (
      <AvaText.Heading3
        textStyle={{color: focused ? theme.colorText1 : theme.colorText2}}>
        {title}
      </AvaText.Heading3>
    );
  };

  const SendTab = ({token}: {token: TokenWithBalance | undefined}) => {
    return {
      [TokenType.AVAX]: <SendAvax />,
      [TokenType.ERC20]: <SendERC20 />,
      [TokenType.ANT]: <SendANT />,
    }[tokenType(token) ?? TokenType.AVAX];
  };

  return (
    <View style={{flex: 1}}>
      <SendHeader onClose={onClose} />
      <TabViewAva renderCustomLabel={renderCustomLabel}>
        <SendTab title={'Send'} token={selectedToken} />
        <ReceiveToken title={'Receive'} />
        {/*<ActivityView embedded title={'Activity'} />*/}
      </TabViewAva>
    </View>
  );
}
