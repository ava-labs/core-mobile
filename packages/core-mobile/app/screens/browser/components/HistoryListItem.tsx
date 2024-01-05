import { Pressable, View, Text, useTheme } from '@avalabs/k2-mobile'
import { useNavigation } from '@react-navigation/native'
import ClearSVG from 'components/svg/ClearSVG'
import AppNavigation from 'navigation/AppNavigation'
import { BrowserScreenProps } from 'navigation/types'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { History } from 'store/browser'
import { removeHistory } from 'store/browser/slices/globalHistory'
import {
  addHistoryForActiveTab,
  addTab,
  selectActiveTab
} from 'store/browser/slices/tabs'

interface Props {
  history: History
}

type HistoryNavigationProp = BrowserScreenProps<
  typeof AppNavigation.Browser.History
>['navigation']

export const HistoryListItem = ({ history }: Props): JSX.Element => {
  const dispatch = useDispatch()
  const { navigate } = useNavigation<HistoryNavigationProp>()
  const activeTab = useSelector(selectActiveTab)
  const {
    theme: { colors }
  } = useTheme()

  const remove = (): void => {
    dispatch(removeHistory({ historyId: history.id }))
  }

  const navigateToTabView = (): void => {
    dispatch(addTab())
    if (activeTab) {
      dispatch(addHistoryForActiveTab(history))
      navigate(AppNavigation.Browser.TabView)
    }
  }

  return (
    <Pressable
      onPress={navigateToTabView}
      sx={{
        flexDirection: 'row',
        marginTop: 8,
        justifyContent: 'space-between',
        flex: 1
      }}>
      <View sx={{ marginRight: 8, flexShrink: 1 }}>
        <Text variant="inputLabel" numberOfLines={1}>
          {history.title}
        </Text>
        <Text variant="caption" numberOfLines={1}>
          {history.url}
        </Text>
      </View>
      <Pressable hitSlop={8} onPress={() => remove()}>
        <ClearSVG
          backgroundColor={colors.$neutral400}
          color={colors.$black}
          size={16}
        />
      </Pressable>
    </Pressable>
  )
}
