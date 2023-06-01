import { useApplicationContext } from 'contexts/ApplicationContext'
import React, { useMemo } from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { COLORS_DAY } from 'resources/Constants'

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
  unselectedColor = COLORS_DAY.neutral50,
  selectedColor = COLORS_DAY.colorPrimary1
}) => {
  const { theme } = useApplicationContext()
  const unselectedRadioColor = unselectedColor || theme.neutral50
  const selectedRadioColor = selectedColor || theme.colorPrimary1

  const getRadioButtonStyle = useMemo(() => {
    if (selected) {
      return {
        ...styles.outerButton,
        backgroundColor: selectedRadioColor,
        borderColor: selectedRadioColor
      }
    }
    return {
      ...styles.outerButton,
      backgroundColor: unselectedRadioColor,
      borderColor: unselectedRadioColor
    }
  }, [selected, selectedRadioColor, unselectedRadioColor])

  return (
    <View style={styles.radioButtonContainer}>
      <View style={getRadioButtonStyle}>
        <Pressable
          onPress={onPress}
          style={{
            ...styles.radioButton,
            backgroundColor: theme.neutralBlack,
            borderColor: selected ? selectedRadioColor : unselectedRadioColor
          }}>
          {selected ? (
            <View
              style={[
                styles.radioButtonIcon,
                {
                  backgroundColor: selected
                    ? selectedRadioColor
                    : unselectedRadioColor
                }
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
    alignItems: 'flex-start',
    marginRight: 10
  },
  outerButton: {
    height: 22,
    width: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5
  },
  radioButton: {
    height: 20,
    width: 20,
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
