import {useState} from 'react';
import {AddrBookItemType, Contact, RecentContact} from 'Repo';
import {Account} from 'dto/Account';
import {useApplicationContext} from 'contexts/ApplicationContext';

export function useAddressBookLists() {
  const {addToRecentContacts} = useApplicationContext().repo.addressBookRepo;
  const [showAddressBook, setShowAddressBook] = useState(false);
  const [tempRecentContact, setTempRecentContact] = useState<
    RecentContact | undefined
  >(undefined);

  const onContactSelected = (
    item: Contact | Account,
    type: AddrBookItemType,
  ) => {
    switch (type) {
      case 'account':
        setTempRecentContact({id: (item as Account).index, type: type});
        break;
      case 'contact':
        setTempRecentContact({id: (item as Contact).id, type: type});
        break;
    }
  };

  const saveRecentContact = () => {
    if (tempRecentContact) {
      addToRecentContacts(tempRecentContact);
    }
  };

  const reset = () => {
    setTempRecentContact(undefined);
  };

  return {
    showAddressBook,
    setShowAddressBook,
    onContactSelected,
    saveRecentContact,
    reset,
  };
}
