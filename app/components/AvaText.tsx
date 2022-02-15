import React, {FC} from 'react';
import {StyleProp, StyleSheet, Text, TextProps, TextStyle} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';

type AvaTextProps = {
  textStyle?: StyleProp<TextStyle>;
  color?: string;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip' | undefined;
  currency?: boolean;
} & TextProps;

const AvaxTextBase: FC<AvaTextProps> = ({currency, children, ...rest}) => {
  const {selectedCurrency, currencyFormatter} = useApplicationContext().appHook;

  if (typeof children === 'string' && currency) {
    return (
      <Text {...rest}>{`${currencyFormatter(
        Number(children),
      )} ${selectedCurrency}`}</Text>
    );
  }
  return <Text {...rest}>{children}</Text>;
};

const LargeTitleBold: FC<AvaTextProps> = ({textStyle, children, ...rest}) => {
  const theme = useApplicationContext().theme;
  return (
    <AvaxTextBase
      {...rest}
      style={[styles.largeTitleBold, {color: theme.colorText1}, textStyle]}>
      {children}
    </AvaxTextBase>
  );
};

const TextHeading1: FC<AvaTextProps> = ({
  textStyle,
  color,
  children,
  ...rest
}) => {
  const theme = useApplicationContext().theme;
  return (
    <AvaxTextBase
      {...rest}
      style={[styles.heading1, {color: color ?? theme.txtListItem}, textStyle]}>
      {children}
    </AvaxTextBase>
  );
};

const TextHeading2: FC<AvaTextProps> = ({
  ellipsizeMode,
  textStyle,
  children,
  ...rest
}) => {
  const theme = useApplicationContext().theme;

  return (
    <AvaxTextBase
      ellipsizeMode={ellipsizeMode}
      numberOfLines={ellipsizeMode ? 1 : undefined}
      style={[
        styles.heading2,
        {color: theme.txtListItem, flexShrink: ellipsizeMode ? 1 : 0},
        textStyle,
      ]}
      {...rest}>
      {children}
    </AvaxTextBase>
  );
};

const TextHeading3: FC<AvaTextProps> = ({
  ellipsizeMode,
  textStyle,
  children,
  currency,
  ...rest
}) => {
  const theme = useApplicationContext().theme;
  return (
    <AvaxTextBase
      {...rest}
      ellipsizeMode={ellipsizeMode}
      numberOfLines={ellipsizeMode ? 1 : undefined}
      currency={currency}
      style={[
        styles.heading3,
        {flexShrink: ellipsizeMode ? 1 : 0, color: theme.txtListItem},
        textStyle,
      ]}>
      {children}
    </AvaxTextBase>
  );
};

const TextBody1: FC<AvaTextProps> = ({
  ellipsizeMode,
  textStyle,
  children,
  color,
  ...rest
}) => {
  const theme = useApplicationContext().theme;
  return (
    <AvaxTextBase
      {...rest}
      ellipsizeMode={ellipsizeMode}
      numberOfLines={ellipsizeMode ? 1 : undefined}
      style={[
        styles.body1,
        {flexShrink: ellipsizeMode ? 1 : 0, color: theme.colorText1},
        textStyle,
        !!color && {color: color},
      ]}>
      {children}
    </AvaxTextBase>
  );
};

const TextBody2: FC<AvaTextProps> = ({
  ellipsizeMode,
  color,
  textStyle,
  children,
  ...rest
}) => {
  const theme = useApplicationContext().theme;
  return (
    <AvaxTextBase
      {...rest}
      ellipsizeMode={ellipsizeMode}
      numberOfLines={ellipsizeMode ? 1 : undefined}
      style={[
        styles.body2,
        {flexShrink: ellipsizeMode ? 1 : 0, color: color ?? theme.colorText2},
        textStyle,
      ]}>
      {children}
    </AvaxTextBase>
  );
};

const TextBody3: FC<AvaTextProps> = ({textStyle, color, children, ...rest}) => {
  return (
    <AvaxTextBase
      style={[styles.body3, textStyle, !!color && {color: color}]}
      {...rest}>
      {children}
    </AvaxTextBase>
  );
};

const TextBody4: FC<AvaTextProps> = ({textStyle, children, ...rest}) => {
  const {theme} = useApplicationContext();
  return (
    <AvaxTextBase
      style={[styles.body4, {color: theme.colorText1}, textStyle]}
      {...rest}>
      {children}
    </AvaxTextBase>
  );
};

const TextTag: FC<AvaTextProps> = ({textStyle, children, ...rest}) => {
  const theme = useApplicationContext().theme;
  return (
    <AvaxTextBase
      style={[styles.textTag, {color: theme.txtListItem}, textStyle]}
      {...rest}>
      {children}
    </AvaxTextBase>
  );
};

const TextButtonLarge: FC<AvaTextProps> = ({
  textStyle,
  color,
  children,
  ...rest
}) => {
  const theme = useApplicationContext().theme;
  return (
    <AvaxTextBase
      style={[
        styles.textButtonLarge,
        {color: color ?? theme.colorText2},
        textStyle,
      ]}
      {...rest}>
      {children}
    </AvaxTextBase>
  );
};

const TextButtonMedium: FC<AvaTextProps> = ({textStyle, children, ...rest}) => {
  return (
    <AvaxTextBase style={[styles.textButtonMedium, textStyle]} {...rest}>
      {children}
    </AvaxTextBase>
  );
};

const TextButtonSmall: FC<AvaTextProps> = ({
  ellipsizeMode,
  textStyle,
  children,
  ...rest
}) => {
  return (
    <AvaxTextBase
      ellipsizeMode={ellipsizeMode}
      numberOfLines={ellipsizeMode ? 1 : undefined}
      style={[
        styles.textButtonSmall,
        {flexShrink: ellipsizeMode ? 1 : 0},
        textStyle,
      ]}
      {...rest}>
      {children}
    </AvaxTextBase>
  );
};

const TextCaption: FC<AvaTextProps> = ({
  textStyle,
  children,
  color,
  ...rest
}) => {
  return (
    <AvaxTextBase
      style={[styles.textCaption, textStyle, !!color && {color: color}]}
      {...rest}>
      {children}
    </AvaxTextBase>
  );
};

const ActivityTotal: FC<AvaTextProps> = ({
  ellipsizeMode,
  textStyle,
  children,
  ...rest
}) => {
  const theme = useApplicationContext().theme;
  return (
    <AvaxTextBase
      {...rest}
      ellipsizeMode={ellipsizeMode}
      numberOfLines={ellipsizeMode ? 1 : undefined}
      style={[
        styles.activityTotal,
        {flexShrink: ellipsizeMode ? 1 : 0, color: theme.colorText1},
        textStyle,
      ]}>
      {children}
    </AvaxTextBase>
  );
};

const AvaText = {
  LargeTitleBold: LargeTitleBold,
  Heading1: TextHeading1,
  Heading2: TextHeading2,
  Heading3: TextHeading3,
  Body1: TextBody1,
  Body2: TextBody2,
  Body3: TextBody3,
  Body4: TextBody4, //this font configuration is not named in design at the time of writing
  Tag: TextTag,
  ButtonLarge: TextButtonLarge,
  ButtonMedium: TextButtonMedium,
  ButtonSmall: TextButtonSmall,
  ActivityTotal: ActivityTotal, //this font configuration is not named in design at the time of writing
  Caption: TextCaption,
};

const styles = StyleSheet.create({
  largeTitleBold: {
    fontFamily: 'Inter-Bold',
    fontSize: 36,
    lineHeight: 44,
  },
  heading1: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    lineHeight: 29,
  },
  heading2: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    lineHeight: 22,
  },
  heading3: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 24,
  },
  body1: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  body2: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 17,
  },
  body3: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 15,
  },
  body4: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 19,
  },
  textTag: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    lineHeight: 24,
  },
  textButtonLarge: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    lineHeight: 22,
  },
  textButtonMedium: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 24,
  },
  textButtonSmall: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    lineHeight: 16,
  },
  activityTotal: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 17,
  },
  textCaption: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '600',
  },
});

export default AvaText;
