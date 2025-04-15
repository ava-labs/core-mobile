import { DropdownItem, DropdownMenu } from 'common/components/DropdownMenu'
import React, { ReactNode, useCallback, useMemo, useState } from 'react'
import {
  FlatList,
  FlatListProps,
  ListRenderItem,
  TouchableOpacity,
  View
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { addHistoryForActiveTab, Favorite } from 'store/browser'
import { SUGGESTED_ITEMS } from 'store/browser/const'
import { selectAllFavorites } from 'store/browser/slices/favorites'
import { useBrowserContext } from '../BrowserContext'
import {
  getSuggestedImage,
  isSuggestedSiteName,
  prepareFaviconToLoad
} from '../utils'
import { BrowserItem } from './BrowserItem'

interface FavoriteOrSuggested extends Favorite {
  isSuggested?: boolean
}

export const FavoritesList = (
  props: Partial<FlatListProps<FavoriteOrSuggested>>
): ReactNode => {
  const dispatch = useDispatch()
  const favorites = useSelector(selectAllFavorites)
  const { handleUrlSubmit } = useBrowserContext()

  const onPress = (item: FavoriteOrSuggested): void => {
    if (item.isSuggested) {
      AnalyticsService.capture('BrowserSuggestedTapped')
    } else {
      AnalyticsService.capture('BrowserFavoritesTapped')
    }

    dispatch(addHistoryForActiveTab(item))
    handleUrlSubmit?.(item.url)
  }

  const renderItem: ListRenderItem<FavoriteOrSuggested> = ({ item }) => {
    if (item.isSuggested) {
      const image = getSuggestedImage(item.title)

      return (
        <View
          style={{
            width: '25%'
          }}>
          <TouchableOpacity onPress={() => onPress(item)}>
            <BrowserItem
              type="grid"
              title={item.title.length ? item.title : item.url}
              image={image}
            />
          </TouchableOpacity>
        </View>
      )
    }

    return (
      <View
        style={{
          width: '25%'
        }}>
        <FavoriteItem item={item} onPress={onPress} />
      </View>
    )
  }

  const data = useMemo(() => {
    const newFavorites = [...favorites].reverse()

    return [
      ...newFavorites,
      ...SUGGESTED_ITEMS.map(item => ({
        title: item.name,
        url: item.siteUrl,
        isSuggested: true
      }))
    ] as FavoriteOrSuggested[]
  }, [favorites])

  return (
    <FlatList
      {...props}
      data={data}
      showsVerticalScrollIndicator={false}
      renderItem={renderItem}
      keyboardShouldPersistTaps="handled"
      numColumns={4}
    />
  )
}

enum MenuId {
  Rename = 'rename',
  Remove = 'remove'
}

const MENU_ITEMS: DropdownItem[] = [
  {
    id: MenuId.Rename,
    title: 'Rename shortcut...'
  },
  {
    id: MenuId.Remove,
    title: 'Remove'
  }
]

const FavoriteItem = ({
  item,
  onPress
}: {
  item: FavoriteOrSuggested
  onPress: (item: Favorite) => void
}): ReactNode => {
  const { handleRenameFavorite, handleRemoveFavorite } = useBrowserContext()
  const [isLongPressActive, setIsLongPressActive] = useState(false)
  const image = isSuggestedSiteName(item.title)
    ? getSuggestedImage(item.title)
    : prepareFaviconToLoad(item.url, item.favicon)

  const onPressAction = useCallback(
    ({ nativeEvent }: { nativeEvent: { event: string } }) => {
      switch (nativeEvent.event) {
        case MenuId.Rename:
          handleRenameFavorite(item)
          break
        case MenuId.Remove: {
          handleRemoveFavorite(item)
          break
        }
      }
      setIsLongPressActive(false)
    },
    [handleRenameFavorite, handleRemoveFavorite, item]
  )

  const handlePress = useCallback(() => {
    if (!isLongPressActive) {
      onPress(item)
    }
    setTimeout(() => {
      setIsLongPressActive(false)
    }, 100)
  }, [isLongPressActive, onPress, item])

  const handleLongPress = useCallback(() => {
    setIsLongPressActive(true)
  }, [])

  const handlePressOut = useCallback(() => {
    setTimeout(() => {
      setIsLongPressActive(false)
    }, 100)
  }, [])

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={handleLongPress}
      onPressOut={handlePressOut}
      delayLongPress={200}>
      <DropdownMenu
        groups={[
          {
            id: `favorite-item-${item.id}`,
            items: MENU_ITEMS
          }
        ]}
        disabled={!isLongPressActive}
        onPressAction={onPressAction}
        triggerAction="longPress">
        <BrowserItem
          type="grid"
          title={item.title.length ? item.title : item.url}
          isFavorite
          image={image}
        />
      </DropdownMenu>
    </TouchableOpacity>
  )
}
