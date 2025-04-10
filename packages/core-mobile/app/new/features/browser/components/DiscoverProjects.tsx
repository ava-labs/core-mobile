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
  ContentfulAsset,
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
      url: item.fields.website ?? ''
    })

    dispatch(
      addHistoryForActiveTab({
        title: item.fields.name ?? '',
        url: item.fields.website ?? ''
      })
    )
    handleUrlSubmit?.(item.fields.website)
  }

  const renderItem: ListRenderItem<ContentfulProject> = ({ item, index }) => {
    const logoUrl = `https:${
      data?.includes.Asset.find(
        (asset: ContentfulAsset) => asset.sys.id === item.fields.logo?.sys.id
      )?.fields.file.url
    }`

    return (
      <BrowserItem
        type={'list'}
        title={item.fields.name}
        subtitle={item.fields.description}
        onPress={() => onPress(item)}
        image={logoUrl}
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
