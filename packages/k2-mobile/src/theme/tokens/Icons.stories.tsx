import React from 'react'
import type { Meta } from '@storybook/react-native'
import { FlatList } from 'react-native'
import { SvgProps } from 'react-native-svg'
import Link from '../../utils/Link'
import { Icons } from './Icons'
import { colors } from './colors'

export default {
  title: 'Icons'
} as Meta

export const All = (): JSX.Element => {
  return (
    <Link
      title="Figma Source"
      url="https://www.figma.com/file/hDSl4OUgXorDAtqPZtCUhB/K2-Foundation?type=design&node-id=376%3A4252&mode=design&t=HOIixbVhKpxGrRwG-1"
    />
  )
}

const Template = ({
  icons,
  resourceURL
}: {
  icons: React.FC<SvgProps>[]
  resourceURL: string
}): JSX.Element => {
  const renderItem = ({ item }: { item: React.FC<SvgProps> }): JSX.Element => {
    const IconComponent = item

    return <IconComponent color={colors.$neutral50} />
  }

  return (
    <FlatList
      contentContainerStyle={{ padding: 16 }}
      data={icons}
      numColumns={12}
      renderItem={renderItem}
      ListHeaderComponent={
        <Link
          title="Figma Source"
          url={resourceURL}
          style={{ marginBottom: 20 }}
        />
      }
    />
  )
}

export const Navigation = (): JSX.Element =>
  Template({
    icons: [Icons.Navigation.Check, Icons.Navigation.ExpandMore],
    resourceURL:
      'https://www.figma.com/file/hDSl4OUgXorDAtqPZtCUhB/K2-Foundation?type=design&node-id=378-5642&mode=design&t=HOIixbVhKpxGrRwG-4'
  })
