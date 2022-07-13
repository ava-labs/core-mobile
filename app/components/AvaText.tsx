import React, { FC } from 'react'
import {
  Animated,
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  TextStyle
} from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'

type BaseAvaTextProps = {
  color?: string
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip' | undefined
  currency?: boolean
  hideTrailingCurrency?: boolean
  animated?: boolean
  textStyle?: Animated.WithAnimatedValue<StyleProp<TextStyle>>
  style: Animated.WithAnimatedValue<StyleProp<TextStyle>>
} & Omit<TextProps, 'style'>

type AvaTextProps = Omit<BaseAvaTextProps, 'style'>

const AvaxTextBase: FC<BaseAvaTextProps> = ({
  animated,
  currency,
  hideTrailingCurrency,
  children,
  ellipsizeMode,
  numberOfLines,
  style,
  ...rest
}) => {
  const { currencyFormatter } = useApplicationContext().appHook
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const numOfLines = ellipsizeMode ? numberOfLines || 1 : undefined

  if (
    (typeof children === 'string' || typeof children === 'number') &&
    currency
  ) {
    return animated ? (
      <Animated.Text
        {...rest}
        numberOfLines={numOfLines}
        ellipsizeMode={ellipsizeMode}>
        {`${currencyFormatter(Number(children))} ${
          hideTrailingCurrency ? '' : selectedCurrency
        }`.trim()}
      </Animated.Text>
    ) : (
      <Text
        {...rest}
        style={style as StyleProp<TextStyle>}
        numberOfLines={numOfLines}
        ellipsizeMode={ellipsizeMode}>
        {`${currencyFormatter(Number(children))} ${
          hideTrailingCurrency ? '' : selectedCurrency
        }`.trim()}
      </Text>
    )
  }
  return animated ? (
    <Animated.Text
      {...rest}
      numberOfLines={numOfLines}
      ellipsizeMode={ellipsizeMode}>
      {children}
    </Animated.Text>
  ) : (
    <Text
      {...rest}
      style={style as StyleProp<TextStyle>}
      numberOfLines={numOfLines}
      ellipsizeMode={ellipsizeMode}>
      {children}
    </Text>
  )
}

const ExtraLargeTitle: FC<AvaTextProps> = ({
  textStyle,
  children,
  ...rest
}) => {
  const theme = useApplicationContext().theme

  return (
    <AvaxTextBase
      {...rest}
      style={[styles.extraLargeTitle, { color: theme.colorText1 }, textStyle]}>
      {children}
    </AvaxTextBase>
  )
}

const LargeTitleBold: FC<AvaTextProps> = ({ textStyle, children, ...rest }) => {
  const theme = useApplicationContext().theme
  return (
    <AvaxTextBase
      {...rest}
      style={[styles.largeTitleBold, { color: theme.colorText1 }, textStyle]}>
      {children}
    </AvaxTextBase>
  )
}

const LargeTitleRegular: FC<AvaTextProps> = ({
  textStyle,
  children,
  ...rest
}) => {
  const theme = useApplicationContext().theme
  return (
    <AvaxTextBase
      {...rest}
      style={[
        styles.largeTitleRegular,
        { color: theme.colorText1 },
        textStyle
      ]}>
      {children}
    </AvaxTextBase>
  )
}

const TextHeading1: FC<AvaTextProps> = ({
  textStyle,
  color,
  children,
  ...rest
}) => {
  const theme = useApplicationContext().theme
  return (
    <AvaxTextBase
      {...rest}
      style={[
        styles.heading1,
        { color: color ?? theme.colorText1 },
        textStyle
      ]}>
      {children}
    </AvaxTextBase>
  )
}

const TextHeading2: FC<AvaTextProps> = ({ textStyle, children, ...rest }) => {
  const theme = useApplicationContext().theme

  return (
    <AvaxTextBase
      style={[styles.heading2, { color: theme.colorText1 }, textStyle]}
      {...rest}>
      {children}
    </AvaxTextBase>
  )
}

const TextHeading3: FC<AvaTextProps> = ({
  textStyle,
  children,
  currency,
  ...rest
}) => {
  const theme = useApplicationContext().theme
  return (
    <AvaxTextBase
      {...rest}
      currency={currency}
      style={[styles.heading3, { color: theme.colorText1 }, textStyle]}>
      {children}
    </AvaxTextBase>
  )
}

const TextBody1: FC<AvaTextProps> = ({
  textStyle,
  children,
  color,
  ...rest
}) => {
  const theme = useApplicationContext().theme
  return (
    <AvaxTextBase
      {...rest}
      style={[
        styles.body1,
        { color: theme.colorText1 },
        textStyle,
        !!color && { color: color }
      ]}>
      {children}
    </AvaxTextBase>
  )
}

const TextBody2: FC<AvaTextProps> = ({
  color,
  textStyle,
  children,
  ...rest
}) => {
  const theme = useApplicationContext().theme
  return (
    <AvaxTextBase
      {...rest}
      style={[styles.body2, { color: color ?? theme.colorText2 }, textStyle]}>
      {children}
    </AvaxTextBase>
  )
}

const TextBody3: FC<AvaTextProps> = ({
  textStyle,
  color,
  children,
  ...rest
}) => {
  return (
    <AvaxTextBase
      style={[styles.body3, textStyle, !!color && { color: color }]}
      {...rest}>
      {children}
    </AvaxTextBase>
  )
}

const TextBody4: FC<AvaTextProps> = ({ textStyle, children, ...rest }) => {
  const { theme } = useApplicationContext()
  return (
    <AvaxTextBase
      style={[styles.body4, { color: theme.colorText1 }, textStyle]}
      {...rest}>
      {children}
    </AvaxTextBase>
  )
}

const TextLink: FC<AvaTextProps> = ({ textStyle, children, ...rest }) => {
  const { theme } = useApplicationContext()
  return (
    <AvaxTextBase
      style={[styles.textLink, { color: theme.colorPrimary1 }, textStyle]}
      {...rest}>
      {children}
    </AvaxTextBase>
  )
}

const TextTag: FC<AvaTextProps> = ({ textStyle, children, ...rest }) => {
  const theme = useApplicationContext().theme
  return (
    <AvaxTextBase
      style={[styles.textTag, { color: theme.colorText1 }, textStyle]}
      {...rest}>
      {children}
    </AvaxTextBase>
  )
}

const TextButtonLarge: FC<AvaTextProps> = ({
  textStyle,
  color,
  children,
  ...rest
}) => {
  const theme = useApplicationContext().theme
  return (
    <AvaxTextBase
      style={[
        styles.textButtonLarge,
        { color: color ?? theme.colorText2 },
        textStyle
      ]}
      {...rest}>
      {children}
    </AvaxTextBase>
  )
}

const TextButtonMedium: FC<AvaTextProps> = ({
  textStyle,
  children,
  color,
  ...rest
}) => {
  const theme = useApplicationContext().theme
  return (
    <AvaxTextBase
      style={[
        styles.textButtonMedium,
        { color: color ?? theme.colorText2 },
        textStyle
      ]}
      {...rest}>
      {children}
    </AvaxTextBase>
  )
}

const TextButtonSmall: FC<AvaTextProps> = ({
  ellipsizeMode,
  textStyle,
  color,
  children,
  ...rest
}) => {
  const theme = useApplicationContext().theme
  return (
    <AvaxTextBase
      ellipsizeMode={ellipsizeMode}
      style={[
        styles.textButtonSmall,
        { flexShrink: ellipsizeMode ? 1 : 0, color: color ?? theme.colorText2 },
        textStyle
      ]}
      {...rest}>
      {children}
    </AvaxTextBase>
  )
}

const TextCaption: FC<AvaTextProps> = ({
  textStyle,
  children,
  color,
  ...rest
}) => {
  return (
    <AvaxTextBase
      style={[styles.textCaption, textStyle, !!color && { color: color }]}
      {...rest}>
      {children}
    </AvaxTextBase>
  )
}

const ActivityTotal: FC<AvaTextProps> = ({ textStyle, children, ...rest }) => {
  const theme = useApplicationContext().theme
  return (
    <AvaxTextBase
      {...rest}
      style={[styles.activityTotal, { color: theme.colorText1 }, textStyle]}>
      {children}
    </AvaxTextBase>
  )
}

const AvaText = {
  ExtraLargeTitle: ExtraLargeTitle,
  LargeTitleBold: LargeTitleBold,
  LargeTitleRegular: LargeTitleRegular,
  Heading1: TextHeading1,
  Heading2: TextHeading2,
  Heading3: TextHeading3,
  Body1: TextBody1,
  Body2: TextBody2,
  Body3: TextBody3,
  Body4: TextBody4, //this font configuration is not named in design at the time of writing
  TextLink: TextLink, //this font configuration is not named in design at the time of writing
  ButtonLarge: TextButtonLarge,
  ButtonMedium: TextButtonMedium,
  ButtonSmall: TextButtonSmall,
  Caption: TextCaption,
  ActivityTotal: ActivityTotal, //this font configuration is not named in design at the time of writing
  Tag: TextTag
}

const styles = StyleSheet.create({
  extraLargeTitle: {
    fontFamily: 'Inter-ExtraBold',
    fontSize: 64,
    lineHeight: 78
  },
  largeTitleBold: {
    fontFamily: 'Inter-Bold',
    fontSize: 36,
    lineHeight: 44
  },
  largeTitleRegular: {
    fontFamily: 'Inter-Regular',
    fontSize: 36,
    lineHeight: 44
  },
  heading1: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    lineHeight: 29
  },
  heading2: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    lineHeight: 22
  },
  heading3: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 24
  },
  body1: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24
  },
  body2: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 17
  },
  body3: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 15
  },
  body4: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 19
  },
  textLink: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 17
  },
  textTag: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    lineHeight: 24
  },
  textButtonLarge: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    lineHeight: 22
  },
  textButtonMedium: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 24
  },
  textButtonSmall: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    lineHeight: 16
  },
  activityTotal: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 17
  },
  textCaption: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 15
  }
})

export default AvaText
