import React from 'react'
import { StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import { Row } from 'components/Row'
import { Space } from 'components/Space'
import { useApplicationContext } from 'contexts/ApplicationContext'

type Props = {
  progress: number // in percentage
}

export const StakeProgress = ({ progress }: Props) => {
  const { theme } = useApplicationContext()
  const percentage = `${progress}%`
  const label = progress < 100 ? percentage + ' complete' : percentage
  const color = theme.blueLight

  return (
    <View style={styles.container}>
      <AvaText.Caption color={color}>{label}</AvaText.Caption>
      <Space y={5} />
      <View>
        <Row style={[styles.base, { backgroundColor: theme.colorBg3 }]} />
        <Row
          style={[
            styles.overlay,
            { backgroundColor: color, width: percentage }
          ]}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  base: {
    height: 4,
    width: '100%',
    borderRadius: 100
  },
  overlay: {
    height: 4,
    position: 'absolute',
    left: 0,
    borderRadius: 100
  }
})
