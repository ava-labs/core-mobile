import AppNavigation from 'navigation/AppNavigation';
import {
  createStackNavigator,
  StackNavigationProp,
} from '@react-navigation/stack';
import React from 'react';
import AddressBook from 'screens/drawer/addressBook/AddressBook';
import {MainHeaderOptions} from 'navigation/NavUtils';
import {useNavigation} from '@react-navigation/native';
import AvaButton from 'components/AvaButton';
import AddSVG from 'components/svg/AddSVG';
import AddContact from 'screens/drawer/addressBook/AddContact';
import ContactDetails from 'screens/drawer/addressBook/ContactDetails';
import AvaText from 'components/AvaText';
import {useApplicationContext} from 'contexts/ApplicationContext';

export type AddressBookStackParamList = {
  [AppNavigation.AddressBook.List]: undefined;
  [AppNavigation.AddressBook.Add]: undefined;
  [AppNavigation.AddressBook.Edit]: undefined;
  [AppNavigation.AddressBook.Details]: {
    contactId: string;
    editable: boolean;
  };
};
const Stack = createStackNavigator<AddressBookStackParamList>();

const AddressBookStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen
        options={{
          headerShown: true,
          ...MainHeaderOptions(
            'Address Book',
            false,
            <AddAddressBookContact />,
          ),
        }}
        name={AppNavigation.AddressBook.List}
        component={AddressBook}
      />
      <Stack.Screen
        options={{
          headerShown: true,
          ...MainHeaderOptions('New Contact'),
        }}
        name={AppNavigation.AddressBook.Add}
        component={AddContact}
      />
      <Stack.Screen
        options={{
          headerShown: true,
          ...MainHeaderOptions('', false, <EditAddressBookContact />),
        }}
        name={AppNavigation.AddressBook.Details}
        component={ContactDetailsComp}
      />
    </Stack.Navigator>
  );
};

const ContactDetailsComp = () => {
  const {setParams, setOptions} =
    useNavigation<StackNavigationProp<AddressBookStackParamList>>();
  return (
    <ContactDetails
      onEditFinished={() => {
        setParams({editable: false});
        setOptions({
          ...MainHeaderOptions('', false, <EditAddressBookContact />),
        });
      }}
    />
  );
};

const AddAddressBookContact = () => {
  const {navigate} =
    useNavigation<StackNavigationProp<AddressBookStackParamList>>();
  return (
    <AvaButton.Icon onPress={() => navigate(AppNavigation.AddressBook.Add)}>
      <AddSVG hideCircle />
    </AvaButton.Icon>
  );
};

const EditAddressBookContact = () => {
  const {theme} = useApplicationContext();
  const {setParams, setOptions} =
    useNavigation<StackNavigationProp<AddressBookStackParamList>>();
  return (
    <AvaButton.Icon
      onPress={() => {
        setParams({editable: true});
        setOptions({
          ...MainHeaderOptions(''),
        });
      }}>
      <AvaText.ButtonLarge textStyle={{color: theme.colorAccent}}>
        Edit
      </AvaText.ButtonLarge>
    </AvaButton.Icon>
  );
};

export default AddressBookStack;
