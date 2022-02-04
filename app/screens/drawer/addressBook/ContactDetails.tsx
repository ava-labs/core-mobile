import {SafeAreaProvider} from 'react-native-safe-area-context';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaText from 'components/AvaText';
import {StyleSheet, View} from 'react-native';
import AvaButton from 'components/AvaButton';
import {RouteProp, useRoute} from '@react-navigation/native';
import {AddressBookStackParamList} from 'navigation/wallet/AddressBookStack';
import BlockchainCircle from 'components/BlockchainCircle';
import useAddressBook from 'screens/drawer/addressBook/useAddressBook';
import CopySVG from 'components/svg/CopySVG';
import ContactInput from 'screens/drawer/addressBook/components/ContactInput';
import FlexSpacer from 'components/FlexSpacer';
import {Space} from 'components/Space';
import {copyToClipboard} from 'utils/DeviceTools';
import {Contact} from 'Repo';

const ContactDetails = ({
  onEditFinished,
  onSend,
}: {
  onEditFinished: () => void;
  onSend: (contact: Contact) => void;
}) => {
  const {titleToInitials, onSave} = useAddressBook();
  const {params} = useRoute<RouteProp<AddressBookStackParamList>>();
  const {addressBook} = useApplicationContext().repo.addressBookRepo;

  const contact = useMemo(
    () =>
      params?.contactId
        ? Object.assign({}, addressBook.get(params.contactId))
        : ({id: '', title: '', address: ''} as Contact),
    [addressBook, params?.contactId],
  );
  const editable = useMemo(() => {
    return params?.editable ?? false;
  }, [params?.editable]);

  const [editAddress, setEditAddress] = useState('');
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (contact.id) {
      setEditAddress(contact.address);
      setEditName(contact.title);
    }
  }, [contact]);

  const save = () => {
    onSave({id: contact.id, title: editName, address: editAddress});
    onEditFinished();
  };

  return (
    <SafeAreaProvider style={{flex: 1, padding: 16}}>
      <View style={{alignItems: 'center'}}>
        <BlockchainCircle
          size={80}
          textSize={32}
          chain={titleToInitials(editName)}
        />
        <Space y={24} />
        <AvaText.Heading2>{editName}</AvaText.Heading2>
      </View>
      <Space y={40} />
      {editable ? (
        <>
          <ContactInput
            initName={contact.title}
            initAddress={contact.address}
            onNameChange={name1 => setEditName(name1)}
            onAddressChange={address1 => setEditAddress(address1)}
          />
          <FlexSpacer />
          <AvaButton.PrimaryLarge onPress={save}>Save</AvaButton.PrimaryLarge>
        </>
      ) : (
        <AddressView contact={contact} />
      )}
      <FlexSpacer />
      <AvaButton.PrimaryLarge onPress={() => onSend(contact)}>
        Send
      </AvaButton.PrimaryLarge>
    </SafeAreaProvider>
  );
};

const AddressView = ({contact}: {contact: Contact}) => {
  const {theme} = useApplicationContext();
  return (
    <>
      <AvaText.Body1>Address</AvaText.Body1>
      <Space y={8} />
      <AvaButton.Base
        onPress={() => copyToClipboard(contact.address)}
        style={[
          styles.copyAddressContainer,
          {backgroundColor: theme.listItemBg},
        ]}>
        <AvaText.ButtonMedium
          ellipsizeMode={'middle'}
          textStyle={{flex: 1, marginRight: 16}}>
          {contact.address}
        </AvaText.ButtonMedium>
        <CopySVG color={theme.colorText1} />
      </AvaButton.Base>
    </>
  );
};

const styles = StyleSheet.create({
  copyAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'baseline',
  },
});

export default ContactDetails;
