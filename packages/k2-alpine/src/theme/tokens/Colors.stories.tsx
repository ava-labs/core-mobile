import React from 'react'

import tinycolor from 'tinycolor2'
import { View, Text, ScrollView, FlatList } from '../../components/Primitives'
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
        flex: 1,
        backgroundColor: value,
        height: 75,
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

export const Tokens = (): JSX.Element => {
  return (
    <ScrollView
      style={{ width: '100%' }}
      contentContainerStyle={{
        top: '5%',
        alignItems: 'center',
        paddingBottom: '15%'
      }}>
      <Link
        title="Figma Source"
        url={FIGMA_LINK}
        style={{ marginVertical: 20 }}
      />
      <Text variant="heading6">Light Mode</Text>
      <FlatList
        style={{
          width: '100%',
          paddingVertical: 10,
          marginVertical: 20
        }}
        contentContainerStyle={{ gap: 10, marginHorizontal: 10 }}
        columnWrapperStyle={{ gap: 10 }}
        data={Object.entries(lightModeColors)}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        renderItem={({ item }: { item: any }) => (
          <Color key={item[0]} name={item[0]} value={item[1]} />
        )}
        numColumns={2}
      />
      <Text variant="heading6">Dark Mode</Text>
      <FlatList
        style={{
          width: '100%',
          paddingVertical: 10,
          marginVertical: 20
        }}
        contentContainerStyle={{ gap: 10, marginHorizontal: 10 }}
        columnWrapperStyle={{ gap: 10 }}
        data={Object.entries(darkModeColors)}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        renderItem={({ item }: { item: any }) => (
          <Color key={item[0]} name={item[0]} value={item[1]} />
        )}
        numColumns={2}
      />
    </ScrollView>
  )
}

export const Colors = (): JSX.Element => {
  return (
    <ScrollView
      style={{ width: '100%' }}
      contentContainerStyle={{
        top: '5%',
        alignItems: 'center',
        paddingBottom: '15%'
      }}>
      <Link
        title="Figma Source"
        url={FIGMA_LINK}
        style={{ marginVertical: 20 }}
      />
      <FlatList
        style={{ width: '100%', marginTop: 20 }}
        contentContainerStyle={{ gap: 10, marginHorizontal: 10 }}
        data={Object.entries(colors)}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        renderItem={({ item }: { item: any }) => (
          <Color key={item[0]} name={item[0]} value={item[1]} />
        )}
      />
    </ScrollView>
  )
}
