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

  const renderItems = () => {
    const rItems = [] as Element[]
    Object.keys(items).forEach(key => {
      const value = items[key]
      try {
        assertNotUndefined(value)
      } catch (e) {
        return
      }
      rItems.push(
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
    })
    return rItems
  }

  return (
    <View
      style={{
        backgroundColor: theme.white,
        paddingHorizontal: 16,
        paddingTop: 8,
        borderRadius: 8,
        marginBottom: 8
      }}>
      {renderItems()}
    </View>
  )
}

export default ActionItems
