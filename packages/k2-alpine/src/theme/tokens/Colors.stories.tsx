import React from 'react'

import tinycolor from 'tinycolor2'
import { View, Text, FlatList } from '../../components/Primitives'
import Link from '../../utils/Link'
import { colors, lightModeColors, darkModeColors } from './colors'

const FIGMA_LINK =
  'https://www.figma.com/design/opZ4C1UGzcoGRjxE4ZIE3J/K2-Alpine?node-id=781-3507&node-type=frame&t=J5mVaf37BsbqucdK-0'

export default {
  title: 'Colors'
}

const Color = ({
  name,
  value
}: {
  name: string
  value: string
}): JSX.Element => {
  const textColor = tinycolor(value).isLight() ? 'black' : 'white'

  return (
    <View
      style={{
        padding: 12,
        flex: 1,
        backgroundColor: value,
        alignItems: 'center',
        justifyContent: 'center'
      }}>
      <Text style={{ color: textColor }} variant="subtitle1">
        {name.substring(1)}
      </Text>
      <Text style={{ color: textColor }} variant="subtitle1">
        {value}
      </Text>
    </View>
  )
}

export const LightMode = (): JSX.Element => {
  return (
    <FlatList
      style={{ flex: 1, width: '100%' }}
      contentContainerStyle={{
        gap: 12,
        padding: 12,
        backgroundColor: lightModeColors.$surfacePrimary
      }}
      data={Object.entries(lightModeColors)}
      ListHeaderComponent={
        <View style={{ alignItems: 'center' }}>
          <Text
            variant="heading3"
            style={{ color: lightModeColors.$textPrimary }}>
            Light Mode
          </Text>
          <Link
            title="Figma Source"
            url={FIGMA_LINK}
            style={{
              marginVertical: 20,
              color: lightModeColors.$textPrimary
            }}
          />
        </View>
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderItem={({ item }: { item: any }) => (
        <Color key={item[0]} name={item[0]} value={item[1]} />
      )}
    />
  )
}

export const DarkMode = (): JSX.Element => {
  return (
    <FlatList
      style={{ flex: 1, width: '100%' }}
      contentContainerStyle={{ gap: 12, padding: 12 }}
      data={Object.entries(darkModeColors)}
      ListHeaderComponent={
        <View style={{ alignItems: 'center' }}>
          <Text variant="heading3">Dark Mode</Text>
          <Link
            title="Figma Source"
            url={FIGMA_LINK}
            style={{ marginVertical: 20 }}
          />
        </View>
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderItem={({ item }: { item: any }) => (
        <Color key={item[0]} name={item[0]} value={item[1]} />
      )}
    />
  )
}

export const Colors = (): JSX.Element => {
  return (
    <FlatList
      style={{ flex: 1, width: '100%' }}
      contentContainerStyle={{ gap: 12, padding: 12 }}
      data={Object.entries(colors)}
      ListHeaderComponent={
        <View style={{ alignItems: 'center' }}>
          <Link
            title="Figma Source"
            url={FIGMA_LINK}
            style={{ marginVertical: 20 }}
          />
        </View>
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderItem={({ item }: { item: any }) => (
        <Color key={item[0]} name={item[0]} value={item[1]} />
      )}
    />
  )
}
