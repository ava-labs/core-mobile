import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'

interface RadioButtonProps {
  onPress: () => void
  selected: boolean
  children: React.ReactNode
  unselectedColor?: string
  selectedColor?: string
}

export const RadioButton: React.FC<RadioButtonProps> = ({
  onPress,
  selected,
  children,
  unselectedColor = '#F8F8FB',
  selectedColor = '#3AA3FF'
}) => {
  return (
    <View style={styles.radioButtonContainer}>
      <View
        style={[
          selected ? styles.selectedOuterButton : styles.unselectedOuterButton,
          {
            backgroundColor: selected ? selectedColor : unselectedColor,
            borderColor: selected ? selectedColor : unselectedColor
          }
        ]}>
        <Pressable
          onPress={onPress}
          style={{
            ...styles.radioButton,
            borderColor: selected ? selectedColor : unselectedColor
          }}>
          {selected ? (
            <View
              style={[
                styles.radioButtonIcon,
                { backgroundColor: selected ? selectedColor : unselectedColor }
              ]}
            />
          ) : null}
        </Pressable>
      </View>

      <Pressable onPress={onPress}>{children}</Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  radioButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10
  },
  unselectedOuterButton: {
    height: 25,
    width: 25,
    borderRadius: 12.5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  selectedOuterButton: {
    height: 25,
    width: 25,
    borderRadius: 12.5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  radioButton: {
    height: 20,
    width: 20,
    backgroundColor: 'black',
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  radioButtonIcon: {
    height: 10,
    width: 10,
    borderRadius: 5
  },
  radioButtonText: {
    fontSize: 16,
    marginLeft: 16
  }
})
