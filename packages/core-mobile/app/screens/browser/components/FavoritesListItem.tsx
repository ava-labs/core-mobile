import { Pressable, View, Text, Image } from '@avalabs/k2-mobile'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { BrowserScreenProps } from 'navigation/types'
import React from 'react'
import { useDispatch } from 'react-redux'
import { Favorite } from 'store/browser'
import { addHistoryForActiveTab } from 'store/browser/slices/tabs'

interface Props {
  favorite: Favorite
  isLastItem: boolean
}

type NavigationProp = BrowserScreenProps<
  typeof AppNavigation.Browser.TabView
>['navigation']

export const FavoritesListItem = ({
  favorite,
  isLastItem
}: Props): JSX.Element => {
  const dispatch = useDispatch()
  const { navigate } = useNavigation<NavigationProp>()

  const navigateToTabView = (): void => {
    dispatch(
      addHistoryForActiveTab({ title: favorite.title, url: favorite.url })
    )
    navigate(AppNavigation.Browser.TabView)
  }

  return (
    <Pressable
      onPress={navigateToTabView}
      sx={{
        flexDirection: 'row',
        marginTop: 8,
        alignItems: 'center'
      }}>
      <Image
        source={{ uri: favorite.favicon }}
        sx={{ width: 48, height: 48, marginBottom: 17, borderRadius: 24 }}
      />
      <View sx={{ marginLeft: 16, flex: 1 }}>
        <Text variant="body1" sx={{ color: '$neutral50' }} numberOfLines={1}>
          {favorite.title}
        </Text>
        <Text variant="body2" sx={{ color: '$neutral400' }} numberOfLines={1}>
          {favorite.description}
        </Text>
        <View
          sx={{
            marginVertical: 8,
            height: 1,
            backgroundColor: isLastItem ? '$transparent' : '$neutral800'
          }}
        />
      </View>
    </Pressable>
  )
}
