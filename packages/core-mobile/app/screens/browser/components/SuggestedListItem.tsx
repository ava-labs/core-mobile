import { Pressable, Text, Image } from '@avalabs/k2-mobile'
import { useNavigation } from '@react-navigation/native'
import { Space } from 'components/Space'
import AppNavigation from 'navigation/AppNavigation'
import { BrowserScreenProps } from 'navigation/types'
import React from 'react'
import { useDispatch } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { DeFiProtocolInformation } from 'services/browser/types'
import { addHistoryForActiveTab } from 'store/browser/slices/tabs'

interface Props {
  suggested: DeFiProtocolInformation
  marginRight: number
}

type NavigationProp = BrowserScreenProps<
  typeof AppNavigation.Browser.TabView
>['navigation']

export const SuggestedListItem = ({
  suggested,
  marginRight
}: Props): JSX.Element => {
  const dispatch = useDispatch()
  const { navigate } = useNavigation<NavigationProp>()

  const navigateToTabView = (): void => {
    AnalyticsService.capture('BrowserSuggestedTapped', {
      url: suggested.siteUrl ?? ''
    })
    dispatch(
      addHistoryForActiveTab({
        title: suggested.name ?? '',
        url: suggested.siteUrl ?? ''
      })
    )
    navigate(AppNavigation.Browser.TabView)
  }

  return (
    <Pressable
      onPress={navigateToTabView}
      sx={{
        flex: 1,
        marginRight,
        alignItems: 'center',
        marginBottom: 24
      }}>
      <Image
        source={{ uri: suggested.logoUrl }}
        sx={{ width: 64, height: 64, borderRadius: 8 }}
      />
      <Space y={4} />
      <Text variant="badgeLabel" sx={{ color: '$white' }} numberOfLines={1}>
        {suggested.name}
      </Text>
    </Pressable>
  )
}
