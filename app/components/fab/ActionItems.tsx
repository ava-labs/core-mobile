import { useApplicationContext } from 'contexts/ApplicationContext'
import { assertNotUndefined } from 'utils/assertions'
import React from 'react'
import { ActionProp } from 'components/fab/types'
import AvaButton from 'components/AvaButton'
import { Row } from 'components/Row'
import { View } from 'react-native'

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
    <View
      style={{
        backgroundColor: theme.white,
        paddingHorizontal: 16,
        paddingTop: 8,
        borderRadius: 8,
        marginBottom: 8
      }}>
      {Object.keys(items).map(key => {
        const value = items[key]
        assertNotUndefined(value)
        return (
          <Row key={key} style={{ marginBottom: 8, alignItems: 'center' }}>
            {value.image}
            <AvaButton.TextLarge
              textColor={theme.colorBg1}
              onPress={() => {
                if (resetOnItemPress) {
                  reset()
                }
                value.onPress()
              }}>
              {key}
            </AvaButton.TextLarge>
          </Row>
        )
      })}
    </View>
  )
}

export default ActionItems
