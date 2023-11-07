import React from 'react'
import type { Meta } from '@storybook/react-native'
import { SectionList } from 'react-native'
import { Text, View } from '../../components/Primitives'
import { Icons } from './Icons'
import { colors } from './colors'

export default {
  title: 'Icons'
} as Meta

export const All = (): JSX.Element => {
  const data = [
    {
      title: 'Navigation',
      data: [Icons.Navigation.Check, Icons.Navigation.ExpandMore]
    }
  ]

  return (
    <SectionList
      contentContainerStyle={{ padding: 16 }}
      sections={data}
      renderItem={({ section, index }) => {
        if (index !== 0) {
          return null
        }

        return (
          <View style={{ flexDirection: 'row' }}>
            {section.data.map((icon, i) => {
              const IconComponent = icon
              return <IconComponent color={colors.$neutral50} key={i} />
            })}
          </View>
        )
      }}
      renderSectionHeader={({ section: { title } }) => {
        return (
          <Text
            variant="heading5"
            style={{ color: colors.$neutral50, marginBottom: 16 }}>
            {title}
          </Text>
        )
      }}
    />
  )
}
