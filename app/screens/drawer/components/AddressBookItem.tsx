import React from 'react';
import AvaListItem from 'components/AvaListItem';
import AvaText from 'components/AvaText';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import AppNavigation from 'navigation/AppNavigation';
import {RootStackParamList} from 'navigation/WalletScreenStack';

const AddressBookItem = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <>
      <AvaListItem.Base
        title={<AvaText.Heading3>Address Book</AvaText.Heading3>}
        titleAlignment={'flex-start'}
        showNavigationArrow
        rightComponentVerticalAlignment={'center'}
        onPress={() => {
          navigation?.navigate(AppNavigation.Wallet.AddressBook);
        }}
      />
    </>
  );
};

export default AddressBookItem;
