import React from 'react'
import { ActivityIndicator } from 'components/ActivityIndicator'

export const FetchingNextIndicator = ({
  isVisible
}: {
  isVisible: boolean
}) => {
  if (!isVisible) return null

  return <ActivityIndicator size={40} />
}
