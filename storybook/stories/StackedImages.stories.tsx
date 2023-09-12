import React from 'react'
import { type Meta } from '@storybook/react-native'

import { StackedImages } from 'components/StackedImages'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { ScrollView } from 'react-native-gesture-handler'
import { withCenterView } from '../decorators/withCenterView'

export default {
  title: 'Stacked Images',
  decorators: [withCenterView]
} as Meta

const Stacked = (flexDirection: 'row' | 'column') => {
  return (
    <ScrollView>
      <AvaText.Heading1>Default</AvaText.Heading1>
      <Space y={16} />
      <StackedImages
        imageUrls={[
          'https://picsum.photos/200',
          'https://picsum.photos/200',
          'https://picsum.photos/200'
        ]}
        flexDirection={flexDirection}
      />
      <Space y={16} />

      <AvaText.Heading1>Custom Size</AvaText.Heading1>
      <Space y={16} />
      <StackedImages
        imageUrls={[
          'https://picsum.photos/200',
          'https://picsum.photos/200',
          'https://picsum.photos/200'
        ]}
        flexDirection={flexDirection}
        size={100}
      />

      <Space y={16} />

      <AvaText.Heading1>Custom margin</AvaText.Heading1>
      <Space y={16} />
      <StackedImages
        imageUrls={[
          'https://picsum.photos/200',
          'https://picsum.photos/200',
          'https://picsum.photos/200'
        ]}
        flexDirection={flexDirection}
        size={100}
        stackMargin={0.7}
      />

      <Space y={16} />

      <AvaText.Heading1>Custom borderRadius</AvaText.Heading1>
      <Space y={16} />
      <StackedImages
        imageUrls={[
          'https://picsum.photos/200',
          'https://picsum.photos/200',
          'https://picsum.photos/200'
        ]}
        flexDirection={flexDirection}
        size={100}
        borderRadius={0}
      />
    </ScrollView>
  )
}

export const Horizontal = () => Stacked('row')
export const Vertical = () => Stacked('column')
