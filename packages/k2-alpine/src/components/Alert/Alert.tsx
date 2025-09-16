import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState
} from 'react'
import {
  Alert as NativeAlert,
  Platform,
  PlatformColor,
  StyleSheet
} from 'react-native'
import Dialog from 'react-native-dialog'
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated'
import { useTheme } from '../../hooks'
import { alpha, ANIMATED } from '../../utils'
import { View } from '../Primitives'
import {
  AlertWithTextInputsHandle,
  ShowAlertConfig,
  ShowAlertWithTextInputsConfig
} from './types'

export const AlertWithTextInputs = forwardRef<
  AlertWithTextInputsHandle,
  object
  // eslint-disable-next-line sonarjs/cognitive-complexity
>((_, ref) => {
  const { theme } = useTheme()
  const [visible, setVisible] = useState(false)
  const [config, setConfig] = useState<ShowAlertWithTextInputsConfig | null>(
    null
  )
  const [values, setValues] = useState<Record<string, string>>({})

  const show = useCallback((alertConfig: ShowAlertWithTextInputsConfig) => {
    setValues(
      alertConfig.inputs.reduce((acc, input) => {
        acc[input.key] = input.defaultValue ?? ''
        return acc
      }, {} as Record<string, string>)
    )
    setConfig(alertConfig)
    setVisible(true)
  }, [])

  const hide = (): void => {
    setVisible(false)
  }

  useImperativeHandle(ref, () => ({
    show,
    hide
  }))

  const renderInputs = useCallback(() => {
    return config?.inputs.map(input => (
      <Dialog.Input
        testID="dialog_input"
        value={values[input.key]}
        key={input.key}
        autoCorrect={false}
        autoFocus
        keyboardType={input.keyboardType}
        secureTextEntry={input.secureTextEntry ?? false}
        blurOnSubmit
        onChangeText={(text: string) => {
          const sanitized =
            typeof input.sanitize === 'function'
              ? input.sanitize({ key: input.key, text })
              : text
          setValues(current => ({ ...current, [input.key]: sanitized }))
        }}
      />
    ))
  }, [config?.inputs, values])

  const renderButtons = useCallback(() => {
    return config?.buttons.map((button, index) => {
      const disabled = button.shouldDisable?.(values)

      if (Platform.OS === 'ios') {
        return (
          <>
            <Dialog.Button
              label={button.text}
              color={
                disabled
                  ? 'gray'
                  : button.style === 'destructive'
                  ? 'red'
                  : undefined
              }
              onPress={() => {
                button.onPress?.(values)
                setVisible(false)
              }}
              disabled={disabled}
            />
            {Platform.OS === 'ios' && index !== config?.buttons.length - 1 && (
              <View
                style={{
                  height: '100%',
                  backgroundColor: PlatformColor('separator'),
                  width: StyleSheet.hairlineWidth
                }}
              />
            )}
          </>
        )
      }

      return (
        <Dialog.Button
          key={index.toString()}
          label={button.text}
          color={
            disabled
              ? 'gray'
              : button.style === 'destructive'
              ? 'red'
              : undefined
          }
          onPress={() => {
            button.onPress?.(values)
            setVisible(false)
          }}
          disabled={disabled}
        />
      )
    })
  }, [config?.buttons, values])

  const keyboard = useAnimatedKeyboard()

  const keyboardAvoidingStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withTiming(
            keyboard.height.value > 0 ? -keyboard.height.value / 4 : 0,
            ANIMATED.TIMING_CONFIG
          )
        }
      ]
    }
  })

  if (!config) return null
  if (!visible) return null

  const { title, description, verticalButtons, buttons } = config

  if (Platform.OS === 'ios') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View
          style={{
            backgroundColor: alpha(theme.colors.$black, 0.2),
            flex: 1,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0
          }}
        />

        <Animated.View style={[keyboardAvoidingStyle, { zIndex: 1 }]}>
          <View
            style={{
              borderRadius: 14,
              overflow: 'hidden',
              backgroundColor: PlatformColor('systemGray6'),
              width: 270
            }}>
            <View
              style={{
                paddingHorizontal: 16,
                paddingVertical: 19,
                gap: 2
              }}>
              {title && title.length > 0 && (
                <Dialog.Title>{title}</Dialog.Title>
              )}
              {description && description.length > 0 && (
                <Dialog.Description>{description}</Dialog.Description>
              )}
            </View>

            {renderInputs()}

            {buttons.length > 0 && (
              <View
                style={{
                  width: '100%',
                  backgroundColor: PlatformColor('separator'),
                  height: StyleSheet.hairlineWidth
                }}
              />
            )}
            <View style={{ flexDirection: 'row' }}>{renderButtons()}</View>
          </View>
        </Animated.View>
      </View>
    )
  }

  return (
    <Dialog.Container
      visible={visible}
      verticalButtons={verticalButtons}
      useNativeDriver>
      {title && title.length > 0 && <Dialog.Title>{title}</Dialog.Title>}
      {description && description.length > 0 && (
        <Dialog.Description>{description}</Dialog.Description>
      )}
      {renderInputs()}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        {renderButtons()}
      </View>
    </Dialog.Container>
  )
})

export function showAlert({
  title,
  description,
  buttons,
  options
}: ShowAlertConfig): void {
  // use react-native's Alert for now
  NativeAlert.alert(title, description, buttons, options)
}
