import { useApplicationContext } from 'contexts/ApplicationContext'
import { assertNotUndefined } from 'utils/assertions'
import React from 'react'
import { ActionProp } from 'components/fab/types'
import { Row } from 'components/Row'
import { Pressable, View } from 'react-native'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'

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
        <Pressable
          key={key}
          onPress={() => {
            if (resetOnItemPress) {
              reset()
            }
            value.onPress()
          }}>
          <Row
            style={{
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              height: 46
            }}>
            {value.image}
            <Space x={16} />
            <AvaText.ButtonLarge color={theme.colorBg1}>
              {key}
            </AvaText.ButtonLarge>
          </Row>
        </Pressable>
      )
    })
    return rItems
  }

  return (
    <View
      style={{
        backgroundColor: theme.white,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 8
      }}>
      {renderItems()}
    </View>
  )
}

export default ActionItems
