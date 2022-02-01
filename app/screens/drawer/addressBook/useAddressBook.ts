import {useCallback} from 'react';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {Contact} from 'Repo';

interface IUseAddressBook {
  titleToInitials: (title: string) => string;
  onSave: (contact: Contact) => void;
}

const useAddressBook = (): IUseAddressBook => {
  const {addressBook, saveAddressBook} =
    useApplicationContext().repo.addressBookRepo;

  const titleToInitials = useCallback((title: string) => {
    return title.split(' ').reduce((previousValue, currentValue) => {
      return currentValue.length > 0
        ? previousValue + currentValue[0]
        : previousValue;
    }, '');
  }, []);

  const onSave = useCallback(
    (contact: Contact) => {
      addressBook.set(contact.id, contact);
      saveAddressBook(addressBook);
    },
    [addressBook, saveAddressBook],
  );

  return {
    titleToInitials,
    onSave,
  };
};

export default useAddressBook;
