import { ListRenderItem } from 'react-native'

import { Button, Icons, Pressable, useTheme, View } from '@avalabs/k2-alpine'
import { ErrorState } from 'common/components/ErrorState'
import React, { ReactNode, useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { addHistoryForActiveTab, selectIsTabEmpty } from 'store/browser'
import { useBrowserContext } from '../BrowserContext'
import { HORIZONTAL_MARGIN } from '../consts'
import {
  ContentfulFeaturedProject,
  useFeaturedProjects
} from '../hooks/useFeaturedProjects'
import { BrowserItem } from './BrowserItem'
import { FlatList } from 'react-native-gesture-handler'

export const DiscoverFeaturedProjects = (): JSX.Element | null => {
  const dispatch = useDispatch()
  const { theme } = useTheme()
  const { handleUrlSubmit } = useBrowserContext()
  const showEmptyTab = useSelector(selectIsTabEmpty)

  const { data, error, refetch } = useFeaturedProjects()

  const randomisedItems = useMemo(
    () => {
      const newItems = [...(data?.items || [])]
      return newItems.sort(() => Math.random() - 0.5).slice(0, 5)
    },
    // Needed for randomization to work when the tab is empty
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data?.items, showEmptyTab]
  )

  const onPress = (item: ContentfulFeaturedProject): void => {
    AnalyticsService.capture('BrowserDiscoverFeaturedProjectTapped', {
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

  const renderItem: ListRenderItem<ContentfulFeaturedProject> = ({
    item,
    index
  }) => {
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
    if (error)
      return (
        <Pressable
          onPress={() => refetch()}
          style={{
            height: 290,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          <ErrorState
            icon={
              <Icons.Navigation.Refresh color={theme.colors.$textPrimary} />
            }
            title={``}
            description={`Content failed to load.\nTap to refresh`}
          />
        </Pressable>
      )
    return (
      <View>
        <BrowserItem type="list" loading />
        <BrowserItem type="list" loading />
        <BrowserItem type="list" loading />
        <BrowserItem type="list" loading />
        <BrowserItem type="list" loading isLast />
      </View>
    )
  }, [error, refetch, theme.colors.$textPrimary])

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
