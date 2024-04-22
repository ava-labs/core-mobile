import React from 'react'

import { StackedImages } from 'components/StackedImages'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { ScrollView } from 'react-native-gesture-handler'
import { withCenterView } from '../decorators/withCenterView'

const IMAGE_URL = 'https://picsum.photos/200'

export default {
  title: 'Stacked Images',
  decorators: [withCenterView]
}

const Stacked = (flexDirection: 'row' | 'column'): React.JSX.Element => {
  return (
    <ScrollView>
      <AvaText.Heading1>Default</AvaText.Heading1>
      <Space y={16} />
      <StackedImages
        imageUrls={[IMAGE_URL, IMAGE_URL, IMAGE_URL]}
        flexDirection={flexDirection}
      />
      <Space y={16} />

      <AvaText.Heading1>Custom Size</AvaText.Heading1>
      <Space y={16} />
      <StackedImages
        imageUrls={[IMAGE_URL, IMAGE_URL, IMAGE_URL]}
        flexDirection={flexDirection}
        size={100}
      />

      <Space y={16} />

      <AvaText.Heading1>Custom margin</AvaText.Heading1>
      <Space y={16} />
      <StackedImages
        imageUrls={[IMAGE_URL, IMAGE_URL, IMAGE_URL]}
        flexDirection={flexDirection}
        size={100}
        stackMarginRatio={0.7}
      />

      <Space y={16} />

      <AvaText.Heading1>Custom borderRadius</AvaText.Heading1>
      <Space y={16} />
      <StackedImages
        imageUrls={[IMAGE_URL, IMAGE_URL, IMAGE_URL]}
        flexDirection={flexDirection}
        size={100}
        borderRadius={0}
      />
    </ScrollView>
  )
}

export const Horizontal = (): React.JSX.Element => Stacked('row')
export const Vertical = (): React.JSX.Element => Stacked('column')
