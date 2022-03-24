import React, {useMemo} from 'react';
import {View} from 'react-native';
import BlockchainCircle from 'components/BlockchainCircle';
import AvaText from 'components/AvaText';
import AvaButton from 'components/AvaButton';
import CopySVG from 'components/svg/CopySVG';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {Space} from 'components/Space';
import {copyToClipboard} from 'utils/DeviceTools';
import useAddressBook from 'screens/drawer/addressBook/useAddressBook';
import {truncateAddress} from 'utils/Utils';

interface Props {
  title: string;
  address: string;
}

export default function AddressBookItem({title, address}: Props) {
  const {theme} = useApplicationContext();
  const {titleToInitials} = useAddressBook();

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
      <BlockchainCircle chain={titleToInitials(title)} />
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
        <AvaText.Body2>{truncateAddress(shortAddress)}</AvaText.Body2>
      </View>
    </View>
  );
}
