import { AlertWithTextInputs, View } from '@avalabs/k2-alpine'
import React, { ReactNode } from 'react'
import { useDispatch } from 'react-redux'
import { updateFavorite } from 'store/browser/slices/favorites'
import { useBrowserContext } from '../BrowserContext'

export const FavoriteAlert = (): ReactNode => {
  const dispatch = useDispatch()
  const {
    favoriteAlertVisible,
    favoriteToRename,
    setFavoriteAlertVisible,
    setFavoriteToRename,
    handleHideFavoriteAlert
  } = useBrowserContext()

  const handleSaveFavoriteTitle = (values: Record<string, string>): void => {
    if (!favoriteToRename) {
      return
    }

    dispatch(
      updateFavorite({ ...favoriteToRename, title: values.favoriteTitle })
    )

    handleHideFavoriteAlert()
    setFavoriteAlertVisible(false)
    setFavoriteToRename(null)
  }

  return (
    <View
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      pointerEvents={favoriteAlertVisible ? 'box-none' : 'none'}>
      <AlertWithTextInputs
        visible={favoriteAlertVisible}
        title="Rename favorite"
        inputs={[
          { key: 'favoriteTitle', defaultValue: favoriteToRename?.title }
        ]}
        buttons={[
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: handleHideFavoriteAlert
          },
          {
            text: 'Save',
            shouldDisable: (values: Record<string, string>) => {
              return values.favoriteTitle?.length === 0
            },
            onPress: handleSaveFavoriteTitle
          }
        ]}
      />
    </View>
  )
}
