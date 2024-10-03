import React from 'react'

import { ScrollView, Text } from '../../components/Primitives'
import Link from '../../utils/Link'
import { text } from './text'

const FIGMA_LINK =
  'https://www.figma.com/design/opZ4C1UGzcoGRjxE4ZIE3J/K2-Alpine?node-id=14-4148&node-type=canvas&t=n6EXyTJUG0nuv3Fv-0'

export default {
  title: 'Text'
}

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
