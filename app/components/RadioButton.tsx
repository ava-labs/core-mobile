import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'

interface RadioButtonProps {
  onPress: () => void
  selected: boolean
  children: React.ReactNode
}

export const RadioButton: React.FC<RadioButtonProps> = ({
  onPress,
  selected,
  children
}) => {
  return (
    <View style={styles.radioButtonContainer}>
      <View
        style={
          selected ? styles.radioOuterButton : styles.radioUnselectedOuterButton
        }>
        <Pressable
          onPress={onPress}
          style={{
            ...styles.radioButton,
            borderColor: selected ? '#3AA3FF' : '#F8F8FB'
          }}>
          {selected ? <View style={styles.radioButtonIcon} /> : null}
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
  radioUnselectedOuterButton: {
    height: 30,
    width: 30,
    backgroundColor: '#F8F8FB',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#F8F8FB',
    // borderColor: 'red',
    alignItems: 'center',
    justifyContent: 'center'
  },
  radioOuterButton: {
    height: 30,
    width: 30,
    backgroundColor: '#3AA3FF',
    borderRadius: 15,
    borderWidth: 1,
    // borderColor: '#3AA3FF',
    // borderColor: 'red',
    alignItems: 'center',
    justifyContent: 'center'
  },
  radioButton: {
    height: 24,
    width: 24,
    backgroundColor: 'black',
    borderRadius: 12,
    borderWidth: 1,
    // borderColor: '#3AA3FF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  radioButtonIcon: {
    height: 14,
    width: 14,
    borderRadius: 7,
    backgroundColor: '#3AA3FF'
  },
  radioButtonText: {
    fontSize: 16,
    marginLeft: 16
  }
})
