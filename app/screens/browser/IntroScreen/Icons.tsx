import React from 'react'

import { Image, useImage } from '@shopify/react-native-skia'

export const SearchIcon = (): JSX.Element | null => {
  const image = useImage(require('assets/icons/search_dark.png'))
  if (!image) {
    return null
  }
  return (
    <Image image={image} fit="contain" x={16} y={328} width={24} height={24} />
  )
}

export const WalletConnectIcon = (): JSX.Element | null => {
  const image = useImage(require('assets/icons/wallet_connect.png'))
  if (!image) {
    return null
  }
  return <Image image={image} x={16} y={391} width={24} height={24} />
}

export const CoreOwlIcon = (): JSX.Element | null => {
  const image = useImage(require('assets/icons/core_owl_icon.png'))
  if (!image) {
    return null
  }
  return <Image image={image} x={16} y={454} width={24} height={24} />
}

export const RocketIcon = (): JSX.Element | null => {
  const image = useImage(require('assets/icons/rocket_launch.png'))
  if (!image) {
    return null
  }
  return <Image image={image} x={16} y={495} width={24} height={24} />
}
