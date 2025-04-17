import { AlertWithTextInputs, View } from '@avalabs/k2-alpine'
import React, { ReactNode } from 'react'
import { useBrowserContext } from '../BrowserContext'

export const FavoriteAlert = (): ReactNode => {
  const { alertRef, favoriteAlertVisible } = useBrowserContext()

  return (
    <View
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      pointerEvents={favoriteAlertVisible ? 'box-none' : 'none'}></View>
  )
}
