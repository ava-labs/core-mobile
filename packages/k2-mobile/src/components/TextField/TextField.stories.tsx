import React from 'react'

import { withCenterView } from '../../../storybook/decorators/withCenterView'
import { ScrollView, View } from '../Primitives'
import Link from '../../utils/Link'
import { TextField, TextFieldSize } from './TextField'

export default {
  title: 'TextField',
  decorators: [withCenterView]
}

export const All = (): JSX.Element => {
  const sizes: TextFieldSize[] = ['large', 'medium', 'small']

  const renderRow = (): JSX.Element => {
    return (
      <View sx={{ flexDirection: 'row' }}>
        {sizes.map((size, index) => (
          <TextField
            style={{
              marginRight: index !== sizes.length - 1 ? 10 : 0,
              width: 180
            }}
            size={size}
            key={index}
            label="Label"
            placeholder="Input Text"
          />
        ))}
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, flex: 1 }}>
      <Link
        title="Figma Source"
        url={FIGMA_LINK}
        style={{ marginBottom: 20 }}
      />
      <View sx={{ flex: 1 }}>{renderRow()}</View>
    </ScrollView>
  )
}

const FIGMA_LINK =
  'https://www.figma.com/file/TAXtaoLGSNNt8nAqqcYH2H/K2-Component-Library?type=design&node-id=550%3A31986&mode=design&t=8cSsvugFjwVLqJNL-1'
