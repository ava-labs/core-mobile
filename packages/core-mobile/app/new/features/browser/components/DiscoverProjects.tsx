import { FlatList, ListRenderItem } from 'react-native'

import { Button, View } from '@avalabs/k2-alpine'
import { useQuery } from '@tanstack/react-query'
import React, { ReactNode, useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { addHistoryForActiveTab, selectIsTabEmpty } from 'store/browser'
import { useBrowserContext } from '../BrowserContext'
import { HORIZONTAL_MARGIN } from '../consts'
import {
  ContentfulProject,
  fetchFeaturedProjects
} from '../hooks/useContentful'
import { BrowserItem } from './BrowserItem'

export const DiscoverProjects = (): JSX.Element | null => {
  const dispatch = useDispatch()
  const { handleUrlSubmit } = useBrowserContext()
  const showEmptyTab = useSelector(selectIsTabEmpty)

  const { data } = useQuery({
    queryKey: ['discover-featured-projects'],
    queryFn: fetchFeaturedProjects
  })

  const randomisedItems = useMemo(
    () => data?.items?.sort(() => Math.random() - 0.5).slice(0, 5) || [],
    // Needed for randomization to work when the tab is empty
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data?.items, showEmptyTab]
  )

  const onPress = (item: ContentfulProject): void => {
    AnalyticsService.capture('BrowserDiscoverTopProjectTapped', {
      url: item.website ?? ''
    })

    dispatch(
      addHistoryForActiveTab({
        title: item.name ?? '',
        url: item.website ?? ''
      })
    )
    handleUrlSubmit?.(item.website)
  }

  const renderItem: ListRenderItem<ContentfulProject> = ({ item, index }) => {
    return (
      <BrowserItem
        type={'list'}
        title={item.name}
        subtitle={item.description}
        onPress={() => onPress(item)}
        image={item.logo?.url}
        isLast={index === (randomisedItems?.length ?? 0) - 1}
        renderRight={
          <Button size="small" type="secondary" onPress={() => onPress(item)}>
            Open
          </Button>
        }
      />
    )
  }

  const renderEmpty = useCallback((): ReactNode => {
    return (
      <View>
        <BrowserItem type="list" loading />
        <BrowserItem type="list" loading />
        <BrowserItem type="list" loading />
        <BrowserItem type="list" loading />
        <BrowserItem type="list" loading isLast />
      </View>
    )
  }, [])

  return (
    <FlatList
      renderItem={renderItem}
      data={randomisedItems}
      contentContainerStyle={{
        paddingBottom: HORIZONTAL_MARGIN
      }}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={renderEmpty}
    />
  )
}
