import { AnimatedPressable, usePressableGesture } from '@avalabs/k2-alpine'
import { DropdownItem, DropdownMenu } from 'common/components/DropdownMenu'
import {
  dismissAlertWithTextInput,
  showAlertWithTextInput
} from 'common/utils/alertWithTextInput'
import { showSnackbar } from 'common/utils/toast'
import React, { ReactNode, useCallback, useMemo, useState } from 'react'
import {
  FlatList,
  FlatListProps,
  InteractionManager,
  ListRenderItem,
  View
} from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'
import { useDispatch, useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { addHistoryForActiveTab, Favorite } from 'store/browser'
import { SUGGESTED_ITEMS } from 'store/browser/const'
import {
  removeFavorite,
  selectAllFavorites,
  updateFavorite
} from 'store/browser/slices/favorites'
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
          <AnimatedPressable onPress={() => onPress(item)}>
            <BrowserItem
              type="grid"
              title={item.title.length ? item.title : item.url}
              image={image}
            />
          </AnimatedPressable>
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
  const dispatch = useDispatch()
  const { inputRef, isRenameFavoriteVisible } = useBrowserContext()

  const [isLongPressActive, setIsLongPressActive] = useState(false)

  const image = isSuggestedSiteName(item.title)
    ? getSuggestedImage(item.title)
    : prepareFaviconToLoad(item.url, item.favicon)

  const handleRemoveFavorite = useCallback(() => {
    dispatch(removeFavorite({ url: item.url }))
    showSnackbar('Removed from Favorites')
  }, [dispatch, item.url])

  const handleHideFavoriteAlert = useCallback((): void => {
    dismissAlertWithTextInput()
    inputRef?.current?.focus()

    InteractionManager.runAfterInteractions(() => {
      isRenameFavoriteVisible.value = false
    })
  }, [inputRef, isRenameFavoriteVisible])

  const handleSaveFavoriteTitle = useCallback(
    (values: Record<string, string>): void => {
      if (!item) {
        return
      }

      dispatch(updateFavorite({ ...item, title: values.favoriteTitle }))

      handleHideFavoriteAlert()
    },
    [dispatch, handleHideFavoriteAlert, item]
  )

  const handleRenameFavorite = useCallback(() => {
    isRenameFavoriteVisible.value = true
    InteractionManager.runAfterInteractions(() => {
      inputRef?.current?.blur()
    })
    showAlertWithTextInput({
      title: 'Rename favorite',
      description: 'Enter a new name for this favorite',
      inputs: [{ key: 'favoriteTitle', defaultValue: item?.title }],
      buttons: [
        {
          text: 'Cancel',
          onPress: handleHideFavoriteAlert
        },
        {
          style: 'default',
          text: 'Save',
          shouldDisable: (values: Record<string, string>) => {
            return (
              values.favoriteTitle?.length === 0 ||
              values.favoriteTitle === item?.title
            )
          },
          onPress: handleSaveFavoriteTitle
        }
      ]
    })
  }, [
    handleHideFavoriteAlert,
    handleSaveFavoriteTitle,
    inputRef,
    isRenameFavoriteVisible,
    item?.title
  ])

  const onPressAction = useCallback(
    ({ nativeEvent }: { nativeEvent: { event: string } }) => {
      switch (nativeEvent.event) {
        case MenuId.Rename:
          handleRenameFavorite()
          break
        case MenuId.Remove: {
          handleRemoveFavorite()
          break
        }
      }
      setIsLongPressActive(false)
    },
    [handleRenameFavorite, handleRemoveFavorite]
  )

  const handlePress = useCallback(() => {
    if (!isLongPressActive) {
      onPress(item)
    }
    setTimeout(() => {
      setIsLongPressActive(false)
    }, 200)
  }, [isLongPressActive, onPress, item])

  const handleLongPress = useCallback(() => {
    setIsLongPressActive(true)
  }, [])

  const {
    animatedStyle,
    onTouchStart,
    onTouchEnd,
    onTouchMove,
    onTouchCancel
  } = usePressableGesture(handleLongPress)

  const tapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onTouchesUp(handlePress)
    .runOnJS(true)

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onTouchesDown(onTouchStart)
    .onTouchesMove(onTouchMove)
    .onTouchesUp(onTouchEnd)
    .onTouchesCancelled(onTouchCancel)
    .runOnJS(true)

  const composedGesture = Gesture.Simultaneous(tapGesture, longPressGesture)

  return (
    <GestureDetector gesture={composedGesture}>
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
        <Animated.View style={animatedStyle}>
          <BrowserItem
            type="grid"
            title={item.title.length ? item.title : item.url}
            isFavorite
            image={image}
          />
        </Animated.View>
      </DropdownMenu>
    </GestureDetector>
  )
}
