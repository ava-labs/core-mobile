import React from 'react'
import { Image } from '@avalabs/k2-mobile'

export const renderNftIcon = (nftUrl: string): React.JSX.Element => {
  return (
    <Image
      source={{ uri: nftUrl }}
      style={{ height: 40, width: 40, borderRadius: 20 }}
    />
  )
}
