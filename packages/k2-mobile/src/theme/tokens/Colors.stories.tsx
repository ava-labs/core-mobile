import React from 'react'

import tinycolor from 'tinycolor2'
import { View, Text, ScrollView } from '../../components/Primitives'
import Link from '../../utils/Link'
import { colors } from './colors'

const FIGMA_LINK =
  'https://www.figma.com/file/hDSl4OUgXorDAtqPZtCUhB/K2-Foundation?type=design&node-id=349-2238'

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
  const textColor = tinycolor(value).isLight() ? '$black' : '$white'

  return (
    <View
      sx={{
        width: '90%',
        marginBottom: 20,
        borderRadius: 6,
        backgroundColor: value,
        height: 75,
        alignItems: 'center',
        justifyContent: 'center'
      }}>
      <Text sx={{ color: textColor }} variant="subtitle1">
        {name.substring(1)} {value}
      </Text>
    </View>
  )
}

export const All = (): JSX.Element => {
  return (
    <ScrollView
      style={{ width: '100%' }}
      contentContainerStyle={{
        top: '5%',
        width: '100%',
        alignItems: 'center',
        paddingBottom: '15%'
      }}>
      <Link
        title="Figma Source"
        url={FIGMA_LINK}
        style={{ marginBottom: 20 }}
      />
      {Object.entries(colors).map(([colorKey, colorValue], index) => (
        <Color key={index} name={colorKey} value={colorValue} />
      ))}
    </ScrollView>
  )
}
