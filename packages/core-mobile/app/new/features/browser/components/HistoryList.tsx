import { Icons, Pressable, Text, useTheme, View } from '@avalabs/k2-alpine'
import { useSearchHistory } from 'hooks/browser/useSearchHistory'
import React, { ReactNode, useEffect } from 'react'
import { FlatList, ListRenderItem } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import {
  addHistoryForActiveTab,
  addTab,
  History,
  selectActiveTab
} from 'store/browser'
import { useBrowserContext } from '../BrowserContext'
import { HORIZONTAL_MARGIN, prepareFaviconToLoad } from '../consts'
import { BrowserItem } from './BrowserItem'

export const HistoryList = (): ReactNode => {
  const { theme } = useTheme()
  const dispatch = useDispatch()
  const { trimmedSearchText, setSearchText, filterHistories } =
    useSearchHistory()
  const { urlEntry, handleUrlSubmit } = useBrowserContext()

  const activeTab = useSelector(selectActiveTab)

  useEffect(() => {
    setSearchText(urlEntry)
  }, [setSearchText, urlEntry])

  const handlePress = (item: History): void => {
    dispatch(addTab())
    if (activeTab) {
      dispatch(addHistoryForActiveTab(item))
      handleUrlSubmit(item.url)
    }
  }

  const renderItem: ListRenderItem<History> = ({ item }) => {
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
            <Icons.Custom.AdvanceTime color={theme.colors.$textSecondary} />
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
      data={filterHistories}
      renderItem={renderItem}
      inverted
      contentContainerStyle={{ paddingBottom: HORIZONTAL_MARGIN }}
      ListHeaderComponent={renderSearchEngine}
    />
  )
}
