import { Icons, Pressable, Text, useTheme, View } from '@avalabs/k2-alpine'
import { useSearchHistory } from 'hooks/browser/useSearchHistory'
import React, { ReactNode, useEffect } from 'react'
import { FlatList, FlatListProps, ListRenderItem } from 'react-native'
import { useDispatch } from 'react-redux'
import { addHistoryForActiveTab, addTab, History } from 'store/browser'
import { useBrowserContext } from '../BrowserContext'
import { HORIZONTAL_MARGIN, prepareFaviconToLoad } from '../consts'
import { BrowserItem } from './BrowserItem'

export const HistoryList = (
  props: Partial<FlatListProps<History>>
): ReactNode => {
  const dispatch = useDispatch()
  const { theme } = useTheme()
  const { trimmedSearchText, setSearchText, filterHistories } =
    useSearchHistory()
  const { urlEntry, handleUrlSubmit } = useBrowserContext()

  useEffect(() => {
    setSearchText(urlEntry)
  }, [setSearchText, urlEntry])

  const handlePress = (item: History): void => {
    dispatch(addTab())
    dispatch(addHistoryForActiveTab(item))
    handleUrlSubmit(item.url)
  }

  const formatDate = (date: Date): string => {
    const now = new Date()
    const historyDate = new Date(date)
    const diffTime = Math.abs(now.getTime() - historyDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays === 0
      ? 'Today'
      : diffDays === 1
      ? 'Yesterday'
      : diffDays < 7
      ? 'Last week'
      : diffDays < 30
      ? 'Last month'
      : historyDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
  }

  const renderItem: ListRenderItem<History> = ({ item }) => {
    const date = formatDate(new Date(item.lastVisited * 1000))
    return (
      <BrowserItem
        type="list"
        title={item.title}
        subtitle={item.url}
        image={prepareFaviconToLoad(item.url, item.favicon)}
        onPress={() => handlePress(item)}
        renderRight={
          <View
            sx={{
              padding: 8,
              borderRadius: 100,
              backgroundColor: '$backgroundSecondary'
            }}>
            {/* TODO: format today/yesterday/last week/short date */}
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
    if (!urlEntry) return null

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
    <FlatList
      keyExtractor={item => item.id}
      {...props}
      inverted
      ListHeaderComponent={renderSearchEngine}
      data={filterHistories}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    />
  )
}
