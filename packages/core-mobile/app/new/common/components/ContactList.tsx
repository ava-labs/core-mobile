import {
  Avatar,
  FlatList,
  Icons,
  NavigationTitleHeader,
  SearchBar,
  Separator,
  SPRING_LINEAR_TRANSITION,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import React, { useCallback, useState, useMemo } from 'react'
import { LayoutRectangle, LayoutChangeEvent } from 'react-native'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import Animated, {
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { truncateAddress } from '@avalabs/core-utils-sdk'
import { Contact } from 'store/addressBook'
import { getAddressFromContact } from 'features/accountSettings/utils/getAddressFromContact'

export const ContactList = ({
  contacts,
  title,
  ListHeader,
  onPress,
  ListEmptyComponent
}: {
  contacts: Contact[]
  title: string
  ListHeader?: React.JSX.Element
  onPress: (contact: Contact) => void
  ListEmptyComponent?: React.JSX.Element
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const [searchText, setSearchText] = useState('')
  const [headerLayout, setHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()
  const headerOpacity = useSharedValue(1)

  const Header = (): JSX.Element =>
    useMemo(() => <NavigationTitleHeader title={title} />, [])

  const { onScroll, targetHiddenProgress } = useFadingHeaderNavigation({
    header: <Header />,
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
    if (searchText === '' || contacts.length === 0) {
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
            onPress={() => onPress(item)}>
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
                  backgroundColor="transparent"
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
    [colors.$textSecondary, onPress, searchResults.length]
  )

  return (
    <FlatList
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={onScroll}
      data={searchResults}
      contentContainerStyle={{ paddingBottom: 60, flexGrow: 1 }}
      keyExtractor={item => (item as Contact).id}
      ListEmptyComponent={ListEmptyComponent}
      ListHeaderComponent={
        <View sx={{ gap: 16, marginHorizontal: 16 }}>
          <Animated.View
            style={[{ opacity: headerOpacity }, animatedHeaderStyle]}
            onLayout={handleHeaderLayout}>
            <Text variant="heading2">{title}</Text>
          </Animated.View>
          <SearchBar
            onTextChanged={setSearchText}
            searchText={searchText}
            placeholder="Search addresses"
            useDebounce={true}
          />
          {ListHeader}
        </View>
      }
      renderItem={item => renderItem(item.item as Contact, item.index)}
    />
  )
}
