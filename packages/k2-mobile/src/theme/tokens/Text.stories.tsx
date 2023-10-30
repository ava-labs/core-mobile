import React from 'react'
import { Linking } from 'react-native'
import type { Meta } from '@storybook/react-native'
import { ScrollView, Text } from '../../components/Primitives'
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
      <Text
        variant="heading5"
        onPress={() => {
          Linking.openURL(FIGMA_LINK)
        }}
        sx={{
          color: '$blueMain',
          textDecorationLine: 'underline',
          marginBottom: 20
        }}>
        Figma Source
      </Text>
      {Object.keys(text).map((variant, index) => (
        // @ts-expect-error
        <Text key={index} variant={variant}>
          {variant}
        </Text>
      ))}
    </ScrollView>
  )
}
