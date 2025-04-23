import {
  Chip,
  Icons,
  Image,
  SimpleDropdown,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { ErrorState } from 'common/components/ErrorState'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { uuid } from 'utils/uuid'
import { useSortedContacts } from 'features/accountSettings/hooks/useSortedContacts'
import { ContactList } from 'common/components/ContactList'
import EMPTY_ADDRESS_BOOK_ICON from '../../../../assets/icons/address_book_empty.png'

export const AddressBookScreen = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { data: contacts, sort } = useSortedContacts()

  const { navigate } = useRouter()
  const { getParent } = useNavigation()

  const goToAddContact = useCallback((): void => {
    navigate({
      pathname: '/accountSettings/addressBook/addContact',
      params: { contactId: uuid() }
    })
  }, [navigate])

  const goToContactDetail = useCallback(
    (contactId: string): void => {
      navigate({
        pathname: '/accountSettings/addressBook/contactDetail',
        params: { contactId }
      })
    },
    [navigate]
  )

  const renderHeaderRight = useCallback(() => {
    return (
      <TouchableOpacity
        onPress={goToAddContact}
        sx={{
          flexDirection: 'row',
          gap: 16,
          marginRight: 18,
          alignItems: 'center'
        }}>
        <Icons.Content.Add
          testID="add_contact_btn"
          width={25}
          height={25}
          color={colors.$textPrimary}
        />
      </TouchableOpacity>
    )
  }, [colors.$textPrimary, goToAddContact])

  useFocusEffect(
    useCallback(() => {
      getParent()?.setOptions({
        headerRight: renderHeaderRight
      })
      return () => {
        getParent()?.setOptions({
          headerRight: undefined
        })
      }
    }, [getParent, renderHeaderRight])
  )

  const renderListHeader = useCallback(() => {
    return contacts.length > 0 ? (
      <View sx={{ marginTop: 8 }}>
        <SimpleDropdown
          from={
            <Chip size="large" hitSlop={8} rightIcon={'expandMore'}>
              {sort.title}
            </Chip>
          }
          sections={sort.data}
          selectedRows={[sort.selected]}
          onSelectRow={sort.onSelected}
        />
      </View>
    ) : undefined
  }, [contacts.length, sort.data, sort.onSelected, sort.selected, sort.title])

  return (
    <ContactList
      title="Contacts"
      contacts={contacts}
      onPress={contact => goToContactDetail(contact.id)}
      ListEmptyComponent={
        <ErrorState
          sx={{ flex: 1 }}
          icon={
            <Image
              source={EMPTY_ADDRESS_BOOK_ICON}
              sx={{ width: 42, height: 42 }}
            />
          }
          title="No saved addresses"
          description="Save addresses for quick access in future transactions"
          button={{
            title: 'Add an address',
            onPress: goToAddContact
          }}
        />
      }
      ListHeader={renderListHeader()}
    />
  )
}
