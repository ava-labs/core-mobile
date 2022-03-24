import {SafeAreaProvider} from 'react-native-safe-area-context';
import React, {useCallback, useState} from 'react';
import FlexSpacer from 'components/FlexSpacer';
import AvaButton from 'components/AvaButton';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {AddressBookStackParamList} from 'navigation/wallet/AddressBookStack';
import ContactInput from 'screens/drawer/addressBook/components/ContactInput';
import useAddressBook from 'screens/drawer/addressBook/useAddressBook';
import {Contact} from 'Repo';
import {v4 as uuidv4} from 'uuid';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';

const AddContact = () => {
  const {goBack} =
    useNavigation<StackNavigationProp<AddressBookStackParamList>>();
  const {onSave} = useAddressBook();

  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');

  const save = useCallback(() => {
    const id = uuidv4();
    onSave({id, title, address} as Contact);
    goBack();
  }, [address, goBack, onSave, title]);

  return (
    <SafeAreaProvider
      style={{flex: 1, paddingHorizontal: 16, paddingBottom: 16}}>
      <AvaText.LargeTitleBold>New Contact</AvaText.LargeTitleBold>
      <Space y={30} />
      <ContactInput
        initName={''}
        initAddress={''}
        onNameChange={name1 => setTitle(name1)}
        onAddressChange={address1 => setAddress(address1)}
      />
      <FlexSpacer />
      <AvaButton.PrimaryLarge disabled={!title || !address} onPress={save}>
        Save
      </AvaButton.PrimaryLarge>
    </SafeAreaProvider>
  );
};

export default AddContact;
