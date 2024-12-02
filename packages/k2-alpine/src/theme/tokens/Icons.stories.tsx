import React from 'react'

import { FlatList } from 'react-native'
import { SvgProps } from 'react-native-svg'
import Link from '../../utils/Link'
import { useTheme } from '../..'
import { Icons } from './Icons'

export default {
  title: 'Icons'
}

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
  const {
    theme: { colors }
  } = useTheme()
  const renderItem = ({ item }: { item: React.FC<SvgProps> }): JSX.Element => {
    const IconComponent = item

    return <IconComponent color={colors.$textPrimary} />
  }

  return (
    <FlatList
      style={{ width: '100%', backgroundColor: colors.$surfacePrimary }}
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

export const Custom = (): JSX.Element =>
  Template({
    icons: [Icons.Custom.FaceID, Icons.Custom.TouchID, Icons.Custom.Pin],
    resourceURL:
      'https://www.figma.com/file/hDSl4OUgXorDAtqPZtCUhB/K2-Foundation?type=design&node-id=378-5642&mode=design&t=HOIixbVhKpxGrRwG-4'
  })
