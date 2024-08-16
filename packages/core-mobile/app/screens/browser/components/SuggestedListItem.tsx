import { Pressable, Text, Image, alpha, useTheme } from '@avalabs/k2-mobile'
import { useNavigation } from '@react-navigation/native'
import { Space } from 'components/Space'
import AppNavigation from 'navigation/AppNavigation'
import { BrowserScreenProps } from 'navigation/types'
import React from 'react'
import { useDispatch } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { addHistoryForActiveTab } from 'store/browser/slices/tabs'
import { SugggestedItem } from 'store/browser/const'

interface Props {
  suggested: SugggestedItem
  marginRight: number
}

type NavigationProp = BrowserScreenProps<
  typeof AppNavigation.Browser.TabView
>['navigation']

export const SuggestedListItem = ({
  suggested,
  marginRight
}: Props): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const dispatch = useDispatch()
  const { navigate } = useNavigation<NavigationProp>()

  const navigateToTabView = (): void => {
    AnalyticsService.capture('BrowserSuggestedTapped', {
      url: suggested.siteUrl ?? ''
    })
    dispatch(
      addHistoryForActiveTab({
        title: suggested.name ?? '',
        url: suggested.siteUrl ?? '',
        favicon: suggested.logo
      })
    )
    navigate(AppNavigation.Browser.TabView)
  }

  return (
    <Pressable
      onPress={navigateToTabView}
      sx={{
        marginRight,
        alignItems: 'center',
        marginBottom: 24
      }}>
      <Image
        source={suggested.logo}
        sx={{
          width: 64,
          height: 64,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: alpha(colors.$white, 0.2)
        }}
      />
      <Space y={4} />
      <Text variant="badgeLabel" sx={{ color: '$white' }} numberOfLines={1}>
        {suggested.name}
      </Text>
    </Pressable>
  )
}
