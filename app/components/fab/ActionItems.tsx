import { useApplicationContext } from 'contexts/ApplicationContext'
import { assertNotUndefined } from 'utils/assertions'
import { View } from 'react-native'
import CircularButton from 'components/CircularButton'
import React from 'react'
import { ActionProp } from 'components/fab/types'

const ActionItems = ({
  items,
  resetOnItemPress,
  reset
}: {
  items: Record<string, ActionProp>
  resetOnItemPress: boolean
  reset: () => void
}) => {
  const { theme } = useApplicationContext()

  return (
    <>
      {Object.keys(items).map(key => {
        const value = items[key]
        assertNotUndefined(value)
        return (
          <View key={key} style={{ marginBottom: 10 }}>
            <CircularButton
              style={{ backgroundColor: theme.white }}
              image={value.image}
              caption={key}
              onPress={() => {
                if (resetOnItemPress) {
                  reset()
                }
                value.onPress()
              }}
            />
          </View>
        )
      })}
    </>
  )
}

export default ActionItems
