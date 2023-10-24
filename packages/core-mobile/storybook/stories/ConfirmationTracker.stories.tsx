import React, { FC, useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import ConfirmationTracker from 'screens/bridge/components/ConfirmationTracker'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import type { Meta } from '@storybook/react-native'
import AvaText from 'components/AvaText'
import { withCenterView } from '../decorators/withCenterView'

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'black'
  }
})

const MultipleContainer: FC = () => {
  const theme = useApplicationContext().theme
  const [testStep, setTestStep] = useState(0)
  const requiredSteps = 4

  useEffect(() => {
    let counter = 0
    const interval = setInterval(() => {
      counter++
      if (counter % 5) {
        const nextStep = testStep + 1
        setTestStep(nextStep)
      }

      if (testStep === 15) {
        clearInterval(interval)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [testStep])

  return (
    <View style={styles.container}>
      <Pressable onPress={() => setTestStep(0)}>
        <AvaText.Heading3>Press to reset</AvaText.Heading3>
      </Pressable>
      <Space y={32} />
      <View
        style={{
          backgroundColor: theme.colorBg2,
          borderRadius: 10,
          paddingHorizontal: 16,
          overflow: 'hidden'
        }}>
        <ConfirmationTracker
          started={true}
          requiredCount={requiredSteps}
          currentCount={testStep}
        />
      </View>
    </View>
  )
}

const SingleContainer: FC = () => {
  const theme = useApplicationContext().theme
  const [testStep, setTestStep] = useState(0)
  const requiredSteps = 1

  return (
    <View style={styles.container}>
      <Pressable onPress={() => setTestStep(0)}>
        <AvaText.Heading3>Press to reset</AvaText.Heading3>
      </Pressable>
      <Space y={32} />
      <View
        style={{
          backgroundColor: theme.colorBg2,
          borderRadius: 10,
          paddingHorizontal: 16,
          overflow: 'hidden'
        }}>
        <ConfirmationTracker
          started={true}
          requiredCount={requiredSteps}
          currentCount={testStep}
        />
      </View>
    </View>
  )
}

export default {
  title: 'ConfirmationTracker',
  decorators: [withCenterView]
} as Meta

export const Single = () => <SingleContainer />

export const Multiple = () => <MultipleContainer />
