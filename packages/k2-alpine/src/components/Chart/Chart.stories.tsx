import React from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { ScrollView, Text, View } from '../Primitives'
import { useTheme } from '../..'
import { minichart_data1, minichart_data2 } from '../../fixtures/minichart'
import { MiniChart } from './MiniChart'

export default {
  title: 'Chart'
}

export const All = (): JSX.Element => {
  const { theme } = useTheme()

  const MINICHART_DOWNSAMPLE_TO = [Number.POSITIVE_INFINITY, 30, 20, 10]
  const MINICHART_DATA = [minichart_data1, minichart_data2]

  const MINICHART_WIDTH = 90
  const MINICHART_HEIGHT = 30

  return (
    <GestureHandlerRootView
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.$surfacePrimary
      }}>
      <ScrollView
        style={{
          width: '100%',
          backgroundColor: theme.colors.$surfacePrimary
        }}
        contentContainerStyle={{ padding: 16, gap: 40 }}>
        {MINICHART_DOWNSAMPLE_TO.map((downsampleTo, index) => (
          <View key={index}>
            <Text sx={{ marginBottom: 10 }}>Downsample to: {downsampleTo}</Text>
            {MINICHART_DATA.map((data, i) => {
              const negative =
                (data[0]?.value ?? 0) - (data[data.length - 1]?.value ?? 0) > 0

              return (
                <View key={i}>
                  <MiniChart
                    downsampleTo={downsampleTo}
                    style={{ width: MINICHART_WIDTH, height: MINICHART_HEIGHT }}
                    data={data}
                    negative={negative}
                  />
                </View>
              )
            })}
          </View>
        ))}
      </ScrollView>
    </GestureHandlerRootView>
  )
}
