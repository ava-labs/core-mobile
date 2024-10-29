import React from 'react'
import tinycolor from 'tinycolor2'
import { useColorScheme } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { View, Text, FlatList } from '../../components/Primitives'
import Link from '../../utils/Link'
import { useTheme } from '../..'
import { GlassView, GlassType } from '../../components/GlassView/GlassView'
import { colors } from './colors'

const FIGMA_LINK =
  'https://www.figma.com/design/opZ4C1UGzcoGRjxE4ZIE3J/K2-Alpine?node-id=1-721&node-type=frame&t=JNmtjxX2p2CadPSd-11'

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

export const Theme = (): JSX.Element => {
  const {
    theme: { colors: themeColors }
  } = useTheme()
  const colorScheme = useColorScheme()

  return (
    <FlatList
      style={{ flex: 1, width: '100%' }}
      contentContainerStyle={{
        gap: 12,
        padding: 12
      }}
      data={Object.entries(themeColors)}
      ListHeaderComponent={
        <View style={{ alignItems: 'center' }}>
          <Text variant="heading3" style={{ color: themeColors.$textPrimary }}>
            {colorScheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </Text>
          <Link
            title="Figma Source"
            url={FIGMA_LINK}
            style={{
              marginVertical: 20,
              color: themeColors.$textPrimary
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

export const Colors = (): JSX.Element => {
  return (
    <FlatList
      style={{ flex: 1, width: '100%' }}
      contentContainerStyle={{
        gap: 12,
        padding: 12
      }}
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

export const Glasses = (): JSX.Element => {
  const types: GlassType[] = ['light', 'light2', 'dark', 'dark2', 'dark3']

  return (
    <LinearGradient
      colors={['#ff4500', '#ff7f00', '#ffa500', '#ffd700', '#ffff00']}
      style={{
        width: '100%',
        flex: 1
      }}>
      <FlatList
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={{
          gap: 12,
          padding: 12
        }}
        data={types}
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
          <View style={{ borderRadius: 10, overflow: 'hidden' }}>
            <GlassView
              style={{
                height: 150,
                alignItems: 'center',
                justifyContent: 'center'
              }}
              glassType={item}>
              <Text>{item}</Text>
            </GlassView>
          </View>
        )}
      />
    </LinearGradient>
  )
}
