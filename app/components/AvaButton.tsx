import React, {FC, useContext} from 'react';
import {StyleSheet, Text, TouchableNativeFeedback, View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';

interface BaseProps {
  onPress: () => void;
  disabled?: boolean;
  style?: any;
}

const AvaButtonBase: FC<BaseProps> = ({onPress, style, disabled, children}) => {
  const theme = useContext(ApplicationContext).theme;
  return (
    <TouchableNativeFeedback
      useForeground={true}
      onPress={onPress}
      disabled={disabled}
      background={TouchableNativeFeedback.Ripple(theme.buttonRipple, false)}>
      <View style={style}>{children}</View>
    </TouchableNativeFeedback>
  );
};

const AvaButtonIcon: FC<BaseProps> = ({onPress, children}) => {
  return (
    <AvaButtonBase onPress={onPress} style={styles.buttonIcon}>
      {children}
    </AvaButtonBase>
  );
};

const BtnPrimaryLarge: FC<BaseProps> = ({onPress, disabled, children}) => {
  const theme = useContext(ApplicationContext).theme;
  return (
    <AvaButtonBase
      onPress={onPress}
      style={[
        styles.btnPrimaryLarge,
        {
          backgroundColor: disabled ? theme.colorDisabled : theme.colorPrimary1,
        },
      ]}>
      <Text
        style={[
          styles.btnPrimaryLargeText,
          {
            color: disabled ? theme.colorText2 : theme.colorText3,
          },
        ]}>
        {children}
      </Text>
    </AvaButtonBase>
  );
};

const BtnSecondaryLarge: FC<BaseProps> = ({onPress, disabled, children}) => {
  const theme = useContext(ApplicationContext).theme;
  return (
    <AvaButtonBase
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btnSecondaryLarge,
        {
          borderColor: disabled ? theme.colorDisabled : theme.colorPrimary1,
          backgroundColor: theme.transparent,
        },
      ]}>
      <Text
        style={[
          styles.btnSecondaryLargeText,
          {
            color: disabled ? theme.colorDisabled : theme.colorPrimary1,
          },
        ]}>
        {children}
      </Text>
    </AvaButtonBase>
  );
};

const AvaButton = {
  PrimaryLarge: BtnPrimaryLarge,
  SecondaryLarge: BtnSecondaryLarge,
  Base: AvaButtonBase,
  Icon: AvaButtonIcon,
};

const styles = StyleSheet.create({
  buttonIcon: {
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  btnPrimaryLarge: {
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    width: 'auto',
    height: 48,
  },
  btnSecondaryLarge: {
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    width: 'auto',
    height: 48,
  },
  btnPrimaryLargeText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  btnSecondaryLargeText: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});

export default AvaButton;
