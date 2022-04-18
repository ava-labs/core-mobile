import React, { FC, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import LineChartSVG from 'components/svg/LineChartSVG'
import CandleChartSVG from 'components/svg/CandleChartSVG'
import { useApplicationContext } from 'contexts/ApplicationContext'

export enum ChartType {
  LINE,
  CANDLE
}

enum IconBackground {
  SELECTED = '#6C6C6E',
  UNSELECTED = '#B4B4B7'
}

interface Props {
  onChartChange: (chart: ChartType) => void
}

const ChartSelector: FC<Props> = ({ onChartChange }) => {
  const [chartSelected, setChartSelected] = useState(ChartType.LINE)

  const lineSelected = chartSelected === ChartType.LINE

  function handleChartChange(chart: ChartType) {
    setChartSelected(chart)
    onChartChange(chart)
  }

  const { theme } = useApplicationContext()
  return (
    <View style={style.container}>
      <Pressable
        onPress={() => handleChartChange(ChartType.LINE)}
        style={[
          style.line,
          { backgroundColor: lineSelected ? '#F1F1F4' : theme.transparent }
        ]}>
        <LineChartSVG
          color={
            lineSelected ? IconBackground.SELECTED : IconBackground.UNSELECTED
          }
        />
      </Pressable>
      <View
        style={{
          height: 24,
          width: 1,
          backgroundColor: theme.colorStroke2
        }}
      />
      <Pressable
        onPress={() => handleChartChange(ChartType.CANDLE)}
        style={[
          style.candle,
          { backgroundColor: lineSelected ? theme.transparent : '#F1F1F4' }
        ]}>
        <CandleChartSVG
          color={
            lineSelected ? IconBackground.UNSELECTED : IconBackground.SELECTED
          }
        />
      </Pressable>
    </View>
  )
}

const style = StyleSheet.create({
  container: {
    borderRadius: 10,
    backgroundColor: '#F1F1F433',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  line: {
    paddingHorizontal: 8,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10
  },
  candle: {
    paddingHorizontal: 8,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10
  }
})

export default ChartSelector
