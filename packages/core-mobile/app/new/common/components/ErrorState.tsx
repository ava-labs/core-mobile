import React from 'react'
import { Image, SxProp } from '@avalabs/k2-alpine'
import { Placeholder } from './Placeholder'

const errorIcon = require('../../assets/icons/weary_emoji.png')

export const ErrorState = ({
  sx,
  icon = <Image source={errorIcon} sx={{ width: 42, height: 42 }} />,
  title = 'Oops! Something went wrong',
  description = 'Please try again later',
  button
}: {
  sx?: SxProp
  icon?: JSX.Element
  title?: string
  description?: string
  button?: {
    title: string
    onPress: () => void
  }
}): JSX.Element => {
  return (
    <Placeholder
      sx={sx}
      icon={icon}
      title={title}
      description={description}
      button={button}
    />
  )
}
