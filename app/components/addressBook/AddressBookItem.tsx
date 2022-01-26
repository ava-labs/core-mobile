import React, {useMemo} from 'react';
import {View} from 'react-native';
import BlockchainCircle from 'components/BlockchainCircle';
import AvaText from 'components/AvaText';
import AvaButton from 'components/AvaButton';
import CopySVG from 'components/svg/CopySVG';
import Clipboard from '@react-native-clipboard/clipboard';
import {ShowSnackBar} from 'components/Snackbar';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {Space} from 'components/Space';

interface Props {
  title: string;
  address: string;
}

const copyToClipboard = (str: string): void => {
  Clipboard.setString(str);
  ShowSnackBar('Copied');
};

export default function AddressBookItem({title, address}: Props) {
  const {theme} = useApplicationContext();
  const initials = useMemo(() => {
    return title.split(' ').reduce((previousValue, currentValue) => {
      return previousValue + currentValue[0];
    }, '');
  }, [title]);

  const shortAddress = useMemo(() => {
    return address;
  }, [address]);

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
      <BlockchainCircle chain={initials} onChainSelected={() => {}} />
      <View style={{flex: 1, marginHorizontal: 16}}>
        <AvaText.Heading3 ellipsizeMode={'tail'}>{title}</AvaText.Heading3>
      </View>
      <View style={{width: 104, flexDirection: 'row', alignItems: 'center'}}>
        <AvaButton.Icon
          onPress={() => copyToClipboard(address)}
          style={{margin: -8}}>
          <CopySVG color={theme.colorText1} size={16} />
        </AvaButton.Icon>
        <Space x={8} />
        <AvaText.Body2 ellipsizeMode={'middle'}>{shortAddress}</AvaText.Body2>
      </View>
    </View>
  );
}
