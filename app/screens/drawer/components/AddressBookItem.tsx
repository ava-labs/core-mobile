import React from 'react';
import AvaListItem from 'components/AvaListItem';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import AppNavigation from 'navigation/AppNavigation';
import {RootStackParamList} from 'navigation/WalletScreenStack';

const AddressBookItem = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <>
      <AvaListItem.Base
        title={'Address Book'}
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
