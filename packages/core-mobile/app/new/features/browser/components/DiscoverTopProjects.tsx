import { FlatList, ListRenderItem } from 'react-native'

import { Button } from '@avalabs/k2-alpine'
import React from 'react'
import { useDispatch } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { addHistoryForActiveTab } from 'store/browser'
import { useBrowserContext } from '../BrowserContext'
import { HORIZONTAL_MARGIN } from '../consts'
import {
  ContentfulProject,
  useFeaturedProjects
} from '../hooks/useFeaturedProjects'
import { BrowserItem } from './BrowserItem'

export const DiscoverTopProjects = (): JSX.Element | null => {
  const dispatch = useDispatch()
  const { handleUrlSubmit } = useBrowserContext()
  const { data } = useFeaturedProjects()

  const onPress = (item: ContentfulProject): void => {
    AnalyticsService.capture('BrowserDiscoverTopProjectTapped', {
      url: item.fields.website
    })

    dispatch(
      addHistoryForActiveTab({
        title: item.fields.name ?? '',
        url: item.fields.website ?? '',
        favicon: item.fields.logo.sys.id
      })
    )
    handleUrlSubmit?.(item.fields.website)
  }

  const renderItem: ListRenderItem<ContentfulProject> = ({ item, index }) => {
    const logoUrl = `https:${
      data?.includes.Asset.find(
        (asset: any) => asset.sys.id === item.fields.logo.sys.id
      )?.fields.file.url
    }`

    return (
      <BrowserItem
        type={'list'}
        title={`${index + 1}. ${item.fields.name}`}
        subtitle={item.fields.website}
        onPress={() => onPress(item)}
        image={logoUrl}
        renderRight={
          <Button size="small" type="secondary" onPress={() => onPress(item)}>
            Open
          </Button>
        }
      />
    )
  }

  return (
    <FlatList
      renderItem={renderItem}
      data={data?.items || []}
      contentContainerStyle={{
        paddingBottom: HORIZONTAL_MARGIN
      }}
    />
  )
}
