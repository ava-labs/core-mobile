import {
  Avatar,
  Chip,
  FlatList,
  Icons,
  Image,
  NavigationTitleHeader,
  SearchBar,
  Separator,
  SimpleDropdown,
  SPRING_LINEAR_TRANSITION,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'

import { truncateAddress } from '@avalabs/core-utils-sdk'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { ErrorState } from 'common/components/ErrorState'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { useSortedContacts } from 'features/accountSettings/hooks/useSortedContacts'
import { getAddressFromContact } from 'features/accountSettings/utils/getAddressFromContact'
import { LayoutChangeEvent, LayoutRectangle } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
import { Contact } from 'store/addressBook'
import { uuid } from 'utils/uuid'

const TITLE = 'Contacts'
const HEADER = <NavigationTitleHeader title={TITLE} />
const EMPTY_ADDRESS_BOOK_ICON = require('../../../../../assets/icons/address_book_empty.png')

const AddressBookScreen = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { data: contacts, sort } = useSortedContacts()

  const [searchText, setSearchText] = useState('')
  const { navigate } = useRouter()
  const [headerLayout, setHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()
  const { getParent } = useNavigation()
  const headerOpacity = useSharedValue(1)
  const { onScroll, targetHiddenProgress } = useFadingHeaderNavigation({
    header: HEADER,
    targetLayout: headerLayout,
    shouldHeaderHaveGrabber: true
  })

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: 1 - targetHiddenProgress.value
  }))

  const handleHeaderLayout = (event: LayoutChangeEvent): void => {
    setHeaderLayout(event.nativeEvent.layout)
  }

  const searchResults = useMemo(() => {
    if (searchText === '' || contacts === undefined || contacts.length === 0) {
      return contacts
    }
    return contacts.filter(
      contact =>
        contact.name.toLowerCase().includes(searchText.toLowerCase()) ||
        contact.address?.toLowerCase().includes(searchText.toLowerCase()) ||
        contact.addressXP?.toLowerCase().includes(searchText.toLowerCase()) ||
        contact.addressBTC?.toLowerCase().includes(searchText.toLowerCase())
    )
  }, [contacts, searchText])

  const goToAddContact = useCallback((): void => {
    navigate({
      pathname: './addressBook/addContact',
      params: { contactId: uuid() }
    })
  }, [navigate])

  const goToContactDetail = useCallback(
    (contactId: string): void => {
      navigate({
        pathname: './addressBook/contactDetail',
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

  const renderItem = useCallback(
    (item: Contact, index: number): React.JSX.Element => {
      const address = getAddressFromContact(item)
      const { name } = item
      const isLastItem = index === searchResults.length - 1

      return (
        <Animated.View
          entering={getListItemEnteringAnimation(index)}
          layout={SPRING_LINEAR_TRANSITION}>
          <TouchableOpacity
            sx={{
              marginTop: 12,
              marginHorizontal: 16,
              justifyContent: 'space-between',
              alignItems: 'center',
              flexDirection: 'row'
            }}
            onPress={() => goToContactDetail(item.id)}>
            <View
              sx={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12
              }}>
              <View
                sx={{
                  width: 40,
                  height: 40
                }}>
                <Avatar
                  size={40}
                  source={item.avatar?.source}
                  hasLoading={false}
                />
              </View>
              <View
                sx={{
                  flexGrow: 1,
                  marginHorizontal: 12,
                  flexDirection: 'row'
                }}>
                <View
                  sx={{
                    justifyItems: 'center',
                    justifyContent: 'center'
                  }}>
                  <Text
                    variant="buttonMedium"
                    numberOfLines={1}
                    sx={{ flex: 1 }}>
                    {name}
                  </Text>
                  {address && (
                    <Text
                      variant="body2"
                      sx={{
                        lineHeight: 16,
                        fontSize: 13,
                        color: '$textSecondary'
                      }}
                      ellipsizeMode="tail"
                      numberOfLines={1}>
                      {truncateAddress(address)}
                    </Text>
                  )}
                </View>
              </View>
            </View>
            <Icons.Navigation.ChevronRight
              width={20}
              height={20}
              color={colors.$textSecondary}
            />
          </TouchableOpacity>
          {!isLastItem && (
            <View sx={{ marginLeft: 62 }}>
              <Separator />
            </View>
          )}
        </Animated.View>
      )
    },
    [colors.$textSecondary, goToContactDetail, searchResults.length]
  )

  return (
    <FlatList
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={onScroll}
      data={searchResults}
      contentContainerStyle={{ paddingBottom: 60, flexGrow: 1 }}
      keyExtractor={item => (item as Contact).id}
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
      ListHeaderComponent={
        <View sx={{ gap: 16, marginHorizontal: 16 }}>
          <Animated.View
            style={[{ opacity: headerOpacity }, animatedHeaderStyle]}
            onLayout={handleHeaderLayout}>
            <Text variant="heading2">{TITLE}</Text>
          </Animated.View>
          <SearchBar
            onTextChanged={setSearchText}
            searchText={searchText}
            placeholder="Search addresses"
            useDebounce={true}
          />
          {contacts.length > 0 && (
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
          )}
        </View>
      }
      renderItem={item => renderItem(item.item as Contact, item.index)}
    />
  )
}

export default AddressBookScreen
