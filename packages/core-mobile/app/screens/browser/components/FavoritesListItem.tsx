import { Pressable, Text, View } from '@avalabs/k2-mobile'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { BrowserScreenProps } from 'navigation/types'
import React from 'react'
import { useDispatch } from 'react-redux'
import { Favorite } from 'store/browser'
import { addHistoryForActiveTab } from 'store/browser/slices/tabs'
import { getNextFavColor } from 'screens/browser/utils'
import { Row } from 'components/Row'
import FlexSpacer from 'components/FlexSpacer'
import Avatar from 'components/Avatar'
import AnalyticsService from 'services/analytics/AnalyticsService'

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
    AnalyticsService.capture('BrowserFavoritesTapped')
    dispatch(
      addHistoryForActiveTab({ title: favorite.title, url: favorite.url })
    )
    navigate(AppNavigation.Browser.TabView)
  }

  return (
    <Pressable onPress={navigateToTabView}>
      <Row style={{ alignItems: 'center', marginVertical: 8 }}>
        <Avatar.Basic
          title={favorite.title}
          logoUri={favorite.favicon}
          size={48}
          fallbackBackgroundColor={getNextFavColor(favorite.id)}
        />
        <View sx={{ flex: 1, marginLeft: 8 }}>
          <Text variant="body1" sx={{ color: '$neutral50' }} numberOfLines={1}>
            {favorite.title}
          </Text>
          <Text variant="body2" sx={{ color: '$neutral400' }} numberOfLines={1}>
            {favorite.description}
          </Text>
          <FlexSpacer />
        </View>
      </Row>
      <View
        sx={{
          height: 1,
          marginLeft: 48,
          backgroundColor: isLastItem ? '$transparent' : '$neutral800'
        }}
      />
    </Pressable>
  )
}
