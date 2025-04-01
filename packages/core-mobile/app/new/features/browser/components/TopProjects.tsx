import { FlatList, ListRenderItem } from 'react-native'
import { SUGGESTED_ITEMS, SuggestedItem } from 'store/browser/const'

import { Button } from '@avalabs/k2-alpine'
import React from 'react'
import { useDispatch } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { addHistoryForActiveTab } from 'store/browser'
import { useBrowserContext } from '../BrowserContext'
import { HORIZONTAL_MARGIN } from '../consts'
import { BrowserItem } from './BrowserItem'

export const TopProjects = (): JSX.Element | null => {
  const dispatch = useDispatch()
  const { handleUrlSubmit } = useBrowserContext()

  const onPress = (suggested: SuggestedItem): void => {
    AnalyticsService.capture('BrowserSuggestedTapped', {
      url: suggested.siteUrl ?? ''
    })

    dispatch(
      addHistoryForActiveTab({
        url: suggested.siteUrl ?? '',
        favicon: suggested.name
      })
    )
    handleUrlSubmit?.(suggested.siteUrl)
  }

  const renderItem: ListRenderItem<SuggestedItem> = ({ item, index }) => {
    return (
      <BrowserItem
        type={'list'}
        title={`${index + 1}. ${item.name}`}
        subtitle={item.siteUrl}
        onPress={() => onPress(item)}
        image={''}
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
      data={SUGGESTED_ITEMS}
      contentContainerStyle={{
        paddingBottom: HORIZONTAL_MARGIN
      }}
    />
  )
}
