import React from 'react'
import type { Meta } from '@storybook/react-native'
import { ScrollView, Text } from '../../components/Primitives'
import Link from '../../utils/Link'
import { text } from './text'

const FIGMA_LINK =
  'https://www.figma.com/file/hDSl4OUgXorDAtqPZtCUhB/K2-Foundation?type=design&node-id=3390-22100'

export default {
  title: 'Text'
} as Meta

export const All = (): JSX.Element => {
  return (
    <ScrollView
      style={{ width: '100%' }}
      contentContainerStyle={{
        top: '5%',
        width: '100%',
        paddingLeft: '7%',
        paddingBottom: '15%'
      }}>
      <Link
        title="Figma Source"
        url={FIGMA_LINK}
        style={{ marginBottom: 20 }}
      />
      {Object.keys(text).map((variant, index) => (
        // @ts-expect-error
        <Text key={index} variant={variant}>
          {variant}
        </Text>
      ))}
    </ScrollView>
  )
}
