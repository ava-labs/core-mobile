import { SvgProps } from 'react-native-svg'
import React from 'react'
import { FlatList } from 'react-native'
import { useTheme } from '../../hooks'
import { View } from '../../components/Primitives'
import Link from '../../utils/Link'

export const Template = ({
  icons,
  resourceURL,
  numColumns = 12,
  itemPadding
}: {
  icons: React.FC<SvgProps>[]
  resourceURL: string
  numColumns?: number
  itemPadding?: number
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const renderItem = ({ item }: { item: React.FC<SvgProps> }): JSX.Element => {
    const IconComponent = item

    return (
      <View sx={{ padding: itemPadding }}>
        <IconComponent color={colors.$textPrimary} />
      </View>
    )
  }

  return (
    <FlatList
      style={{ width: '100%', backgroundColor: colors.$surfacePrimary }}
      contentContainerStyle={{ padding: 16 }}
      data={icons}
      numColumns={numColumns}
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
