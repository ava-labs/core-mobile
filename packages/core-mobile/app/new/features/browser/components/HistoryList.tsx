import {
  Icons,
  Pressable,
  SPRING_LINEAR_TRANSITION,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { useSearchHistory } from 'hooks/browser/useSearchHistory'
import React, { ReactNode, useEffect } from 'react'
import { FlatList, FlatListProps, ListRenderItem } from 'react-native'
import Animated from 'react-native-reanimated'
import { useDispatch } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { addHistoryForActiveTab, addTab, History } from 'store/browser'
import {
  format,
  isSameDay,
  isYesterday,
  isSameWeek,
  isSameMonth,
  subWeeks,
  subMonths
} from 'date-fns'
import { useBrowserContext } from '../BrowserContext'
import { HORIZONTAL_MARGIN } from '../consts'
import {
  getSuggestedImage,
  isSuggestedSiteName,
  prepareFaviconToLoad
} from '../utils'
import { BrowserItem } from './BrowserItem'

export const HistoryList = (
  props: Partial<FlatListProps<History>>
): ReactNode => {
  const dispatch = useDispatch()
  const { theme } = useTheme()
  const { trimmedSearchText, setSearchText, filteredHistory } =
    useSearchHistory()
  const { urlEntry, handleUrlSubmit } = useBrowserContext()

  useEffect(() => {
    if (urlEntry.length) {
      setSearchText(urlEntry)
    } else {
      setTimeout(() => {
        setSearchText('')
      }, 300)
    }
  }, [setSearchText, urlEntry])

  const handlePress = (item: History): void => {
    AnalyticsService.capture('BrowserHistoryTapped', {
      url: item.url
    })
    dispatch(addTab())
    dispatch(addHistoryForActiveTab(item))
    handleUrlSubmit(item.url)
  }

  const formatDate = (date: Date): string => {
    if (isSameDay(date, new Date())) {
      // Today: show just time in 12-hour format
      return 'Today'
    }

    if (isYesterday(date)) {
      // Yesterday: show "Yesterday HH:MM AM/PM"
      return `Yesterday`
    }

    const today = new Date()
    const lastWeek = subWeeks(today, 1)
    const lastMonth = subMonths(today, 1)

    if (isSameWeek(date, lastWeek)) {
      // Last week: show "Last week"
      return 'Last week'
    }

    if (isSameMonth(date, lastMonth)) {
      // Last month: show "Last month"
      return 'Last month'
    }

    // Older dates: show "MM/DD/YY HH:MM AM/PM"
    return format(date, 'MM/dd/yy h:mm a')
  }

  const renderItem: ListRenderItem<History> = ({ item }) => {
    const date = formatDate(new Date(item.lastVisited * 1000))
    const image = isSuggestedSiteName(item.title)
      ? getSuggestedImage(item.title)
      : prepareFaviconToLoad(item.url, item.favicon)

    return (
      <BrowserItem
        type="list"
        title={item.title}
        subtitle={item.url}
        image={image}
        onPress={() => handlePress(item)}
        renderRight={
          <View
            sx={{
              padding: 8,
              borderRadius: 100,
              backgroundColor: '$backgroundSecondary'
            }}>
            <Text
              variant="body2"
              style={{
                color: theme.colors.$textSecondary
              }}>
              {date}
            </Text>
          </View>
        }
      />
    )
  }

  const handleSearchEngine = (): void => {
    handleUrlSubmit(trimmedSearchText)
  }

  function renderSearchEngine(): ReactNode {
    return (
      <Pressable
        onPress={handleSearchEngine}
        sx={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          height: 62,
          justifyContent: 'space-between',
          paddingHorizontal: HORIZONTAL_MARGIN
        }}>
        <View
          sx={{
            borderRadius: 100,
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row'
          }}>
          <Icons.Logos.Google width={36} height={36} />
        </View>
        <Text
          numberOfLines={1}
          sx={{
            fontFamily: 'Inter-Medium',
            color: '$textSecondary',
            flex: 1
          }}>
          {`Google Search `}
          <Text
            style={{
              fontFamily: 'Inter-Medium'
            }}>{`"${trimmedSearchText}"`}</Text>
        </Text>
      </Pressable>
    )
  }

  return (
    <Animated.View
      entering={getListItemEnteringAnimation(0)}
      layout={SPRING_LINEAR_TRANSITION}
      style={{
        flex: 1
      }}>
      <FlatList
        keyExtractor={item => item.id}
        {...props}
        inverted
        ListHeaderComponent={renderSearchEngine}
        data={filteredHistory}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </Animated.View>
  )
}
