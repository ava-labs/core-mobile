import React, { FC, PropsWithChildren, ReactNode } from 'react'
import {
  Pressable,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle
} from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import { Opacity12, Opacity15 } from 'resources/Constants'
import AvaText from './AvaText'

interface BaseProps extends PropsWithChildren {
  onPress?: () => void
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  rippleBorderless?: boolean
  textColor?: string
  icon?: React.ReactNode
  testID?: string
}

const AvaButtonBase: FC<BaseProps> = ({
  rippleBorderless,
  onPress,
  style,
  disabled,
  children,
  testID
}) => {
  const theme = useApplicationContext().theme
  return (
    <Pressable
      accessible={false}
      testID={testID}
      android_ripple={{
        color: theme.buttonRipple,
        borderless: rippleBorderless ?? false
      }}
      style={style}
      onPress={onPress}
      disabled={disabled}>
      {children}
    </Pressable>
  )
}

const AvaButtonIcon: FC<BaseProps> = ({
  style,
  disabled,
  onPress,
  children
}) => {
  return (
    <AvaButtonBase
      disabled={disabled}
      onPress={onPress}
      rippleBorderless={true}
      style={[styles.buttonIcon, style]}>
      {children}
    </AvaButtonBase>
  )
}

const TextWithIcon: FC<
  BaseProps & {
    icon: ReactNode
    text: ReactNode
    gap?: number
    iconPlacement?: 'left' | 'right'
  }
> = ({
  style,
  disabled,
  onPress,
  icon,
  text,
  gap = 8,
  iconPlacement = 'left'
}) => {
  return (
    <AvaButton.Base disabled={disabled} onPress={onPress} style={[style]}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center'
        }}
        testID="textWithIcon">
        {iconPlacement === 'left' ? (
          <>
            {icon}
            <Space x={gap} />
            {text}
          </>
        ) : (
          <>
            {text}
            <Space x={gap} />
            {icon}
          </>
        )}
      </View>
    </AvaButton.Base>
  )
}

const BtnPrimary: FC<BaseProps> = ({ onPress, disabled, children, style }) => {
  const theme = useApplicationContext().theme
  return (
    <AvaButtonBase
      disabled={disabled}
      onPress={onPress}
      style={[
        {
          alignItems: 'center',
          borderRadius: 25,
          backgroundColor: disabled
            ? theme.alternateBackground + Opacity12
            : theme.alternateBackground
        },
        style
      ]}
      testID="btnPrimary">
      {children}
    </AvaButtonBase>
  )
}

const BtnSecondary: FC<BaseProps> = ({
  onPress,
  disabled,
  children,
  style
}) => {
  const theme = useApplicationContext().theme
  return (
    <AvaButtonBase
      disabled={disabled}
      onPress={onPress}
      style={[
        {
          alignItems: 'center',
          backgroundColor: theme.alternateBackground + Opacity15,
          justifyContent: 'center',
          borderRadius: 25
        },
        style
      ]}
      testID="btnSecondary">
      {children}
    </AvaButtonBase>
  )
}

const BtnText: FC<BaseProps> = ({ onPress, disabled, children, style }) => {
  const theme = useApplicationContext().theme
  return (
    <AvaButtonBase
      disabled={disabled}
      onPress={onPress}
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.transparent
        },
        style
      ]}
      testID="btnText">
      {children}
    </AvaButtonBase>
  )
}

const BtnPrimaryLarge: FC<BaseProps> = ({
  onPress,
  disabled,
  children,
  style,
  textColor
}) => {
  const theme = useApplicationContext().theme
  return (
    <BtnPrimary
      disabled={disabled}
      onPress={onPress}
      style={[styles.btnPrimaryLarge, style]}>
      <AvaText.ButtonLarge
        textStyle={{
          color: disabled ? theme.colorDisabled : textColor ?? theme.colorBg2
        }}>
        {children}
      </AvaText.ButtonLarge>
    </BtnPrimary>
  )
}

const BtnPrimaryMedium: FC<BaseProps> = ({
  onPress,
  disabled,
  children,
  style,
  textStyle
}) => {
  const theme = useApplicationContext().theme
  return (
    <BtnPrimary
      disabled={disabled}
      onPress={onPress}
      style={[styles.btnPrimaryMedium, style]}>
      <AvaText.ButtonMedium
        textStyle={[
          { color: disabled ? theme.colorDisabled : theme.colorBg2 },
          textStyle
        ]}>
        {children}
      </AvaText.ButtonMedium>
    </BtnPrimary>
  )
}

const BtnSecondaryLarge: FC<BaseProps> = ({
  onPress,
  disabled,
  children,
  style
}) => {
  const theme = useApplicationContext().theme
  return (
    <BtnSecondary
      onPress={onPress}
      disabled={disabled}
      style={[styles.btnSecondaryLarge, style]}>
      <AvaText.ButtonLarge
        adjustsFontSizeToFit={true}
        textStyle={{
          color: disabled ? theme.colorDisabled : theme.colorText1
        }}>
        {children}
      </AvaText.ButtonLarge>
    </BtnSecondary>
  )
}

const BtnSecondaryMedium: FC<BaseProps> = ({
  onPress,
  disabled,
  children,
  icon,
  style
}) => {
  const theme = useApplicationContext().theme
  const textStyles = {
    color: disabled ? theme.colorDisabled : theme.colorText1
  }

  const renderIcon = (): JSX.Element => (
    <>
      {icon}
      <Space x={8} />
    </>
  )

  return (
    <BtnSecondary
      onPress={onPress}
      disabled={disabled}
      style={[styles.btnSecondaryMedium, style]}>
      <View style={{ flexDirection: 'row' }}>
        {icon && renderIcon()}
        <AvaText.ButtonMedium
          textStyle={textStyles}
          testID="btnSecondaryMedium">
          {children}
        </AvaText.ButtonMedium>
      </View>
    </BtnSecondary>
  )
}

const BtnTextLarge: FC<BaseProps> = ({
  onPress,
  disabled,
  textColor,
  children,
  style
}) => {
  const theme = useApplicationContext().theme
  return (
    <BtnText
      onPress={onPress}
      style={[styles.btnTextLarge, style]}
      disabled={disabled}>
      <AvaText.ButtonLarge
        textStyle={{
          color: disabled
            ? theme.colorDisabled
            : textColor
            ? textColor
            : theme.colorPrimary1
        }}
        testID="btnTextLarge">
        {children}
      </AvaText.ButtonLarge>
    </BtnText>
  )
}

const BtnTextMedium: FC<BaseProps> = ({
  onPress,
  disabled,
  textColor,
  children,
  style
}) => {
  const theme = useApplicationContext().theme
  return (
    <BtnText
      onPress={onPress}
      style={[styles.btnTextMedium, style]}
      disabled={disabled}>
      <AvaText.ButtonSmall
        textStyle={{
          color: disabled
            ? theme.colorDisabled
            : textColor
            ? textColor
            : theme.colorPrimary1
        }}
        testID="btnTextMedium">
        {children}
      </AvaText.ButtonSmall>
    </BtnText>
  )
}

const BtnTextLink: FC<BaseProps> = ({
  onPress,
  disabled,
  children,
  style,
  textColor
}) => {
  const theme = useApplicationContext().theme

  return (
    <BtnText
      disabled={disabled}
      onPress={onPress}
      style={[styles.btnTextLink, style]}>
      <AvaText.TextLink
        textStyle={{
          color: disabled ? theme.colorDisabled : textColor ?? theme.colorBg2
        }}>
        {children}
      </AvaText.TextLink>
    </BtnText>
  )
}

const AvaButton = {
  PrimaryLarge: BtnPrimaryLarge,
  PrimaryMedium: BtnPrimaryMedium,
  SecondaryLarge: BtnSecondaryLarge,
  SecondaryMedium: BtnSecondaryMedium,
  TextLarge: BtnTextLarge,
  TextMedium: BtnTextMedium,
  Base: AvaButtonBase,
  Icon: AvaButtonIcon,
  TextWithIcon: TextWithIcon,
  TextLink: BtnTextLink
}

const styles = StyleSheet.create({
  buttonIcon: {
    height: 48,
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8
  },
  btnPrimaryLarge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    width: 'auto',
    height: 48,
    justifyContent: 'center'
  },
  btnPrimaryMedium: {
    paddingHorizontal: 32,
    paddingVertical: 8,
    height: 40
  },
  btnSecondaryMedium: {
    paddingHorizontal: 32,
    paddingVertical: 8,
    height: 40
  },
  btnSecondaryLarge: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: 'auto',
    height: 48
  },
  btnTextLarge: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 46
  },
  btnTextMedium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 40
  },
  btnTextLink: {
    height: 48,
    paddingHorizontal: 16
  }
})

export default AvaButton
