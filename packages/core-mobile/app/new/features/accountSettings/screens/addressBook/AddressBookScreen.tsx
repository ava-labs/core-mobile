import { Chip, Icons, Image, useTheme, View } from '@avalabs/k2-alpine'
import { ContactList } from 'common/components/ContactList'
import { ErrorState } from 'common/components/ErrorState'
import NavigationBarButton from 'common/components/NavigationBarButton'
import { useRouter } from 'expo-router'
import { useSortedContacts } from 'features/accountSettings/hooks/useSortedContacts'
import React, { useCallback } from 'react'
import { uuid } from 'utils/uuid'
import { DropdownMenu } from 'common/components/DropdownMenu'
import EMPTY_ADDRESS_BOOK_ICON from '../../../../assets/icons/address_book_empty.png'

export const AddressBookScreen = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { data: contacts, sort } = useSortedContacts()

  const { navigate } = useRouter()

  const goToAddContact = useCallback((): void => {
    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/accountSettings/addressBook/addContact',
      params: { contactId: uuid() }
    })
  }, [navigate])

  const goToContactDetail = useCallback(
    (contactId: string): void => {
      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/accountSettings/addressBook/contactDetail',
        params: { contactId }
      })
    },
    [navigate]
  )

  const renderHeaderRight = useCallback(() => {
    return (
      <NavigationBarButton
        isModal
        testID="add_contact_btn"
        onPress={goToAddContact}>
        <Icons.Content.Add width={24} height={24} color={colors.$textPrimary} />
      </NavigationBarButton>
    )
  }, [colors.$textPrimary, goToAddContact])

  const renderListHeader = useCallback(() => {
    return contacts.length > 0 ? (
      <View style={{ flexDirection: 'row' }}>
        <DropdownMenu
          groups={sort.data}
          onPressAction={(event: { nativeEvent: { event: string } }) =>
            sort.onSelected(event.nativeEvent.event)
          }>
          <Chip size="large" hitSlop={8} rightIcon={'expandMore'}>
            {sort.title}
          </Chip>
        </DropdownMenu>
      </View>
    ) : undefined
  }, [contacts.length, sort])

  return (
    <ContactList
      title="Contacts"
      contacts={contacts}
      onPress={contact => goToContactDetail(contact.id)}
      renderHeaderRight={renderHeaderRight}
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
