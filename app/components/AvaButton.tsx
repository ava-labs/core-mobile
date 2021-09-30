import React, {FC, useContext} from 'react';
import {StyleSheet, TouchableNativeFeedback, View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import AvaText from './AvaText';

interface BaseProps {
  onPress?: () => void;
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

const AvaButtonIcon: FC<BaseProps> = ({disabled, onPress, children}) => {
  return (
    <AvaButtonBase
      disabled={disabled}
      onPress={onPress}
      style={styles.buttonIcon}>
      {children}
    </AvaButtonBase>
  );
};

const BtnPrimary: FC<BaseProps> = ({onPress, disabled, children, style}) => {
  const theme = useContext(ApplicationContext).theme;
  return (
    <AvaButtonBase
      disabled={disabled}
      onPress={onPress}
      style={[
        {
          alignItems: 'center',
          borderRadius: 8,
          backgroundColor: disabled ? theme.colorDisabled : theme.colorPrimary1,
        },
        style,
      ]}>
      {children}
    </AvaButtonBase>
  );
};

const BtnSecondary: FC<BaseProps> = ({onPress, disabled, children, style}) => {
  const theme = useContext(ApplicationContext).theme;
  return (
    <AvaButtonBase
      disabled={disabled}
      onPress={onPress}
      style={[
        {
          alignItems: 'center',
          borderColor: disabled ? theme.colorDisabled : theme.colorPrimary1,
          backgroundColor: theme.transparent,
          justifyContent: 'center',
          borderRadius: 8,
          borderWidth: 2,
        },
        style,
      ]}>
      {children}
    </AvaButtonBase>
  );
};

const BtnText: FC<BaseProps> = ({onPress, disabled, children, style}) => {
  const theme = useContext(ApplicationContext).theme;
  return (
    <AvaButtonBase
      disabled={disabled}
      onPress={onPress}
      style={[
        {
          alignItems: 'center',
          height: 48,
          justifyContent: 'center',
          backgroundColor: theme.transparent,
        },
        style,
      ]}>
      {children}
    </AvaButtonBase>
  );
};

const BtnPrimaryLarge: FC<BaseProps> = ({
  onPress,
  disabled,
  children,
  style,
}) => {
  const theme = useContext(ApplicationContext).theme;
  return (
    <BtnPrimary
      disabled={disabled}
      onPress={onPress}
      style={[styles.btnPrimaryLarge, style]}>
      <AvaText.ButtonLarge
        textStyle={{color: disabled ? theme.colorText2 : theme.colorText3}}>
        {children}
      </AvaText.ButtonLarge>
    </BtnPrimary>
  );
};

const BtnPrimaryMedium: FC<BaseProps> = ({onPress, disabled, children}) => {
  const theme = useContext(ApplicationContext).theme;
  return (
    <BtnPrimary
      disabled={disabled}
      onPress={onPress}
      style={styles.btnPrimaryMedium}>
      <AvaText.ButtonMedium
        textStyle={{color: disabled ? theme.colorText2 : theme.colorText3}}>
        {children}
      </AvaText.ButtonMedium>
    </BtnPrimary>
  );
};

const BtnSecondaryLarge: FC<BaseProps> = ({onPress, disabled, children}) => {
  const theme = useContext(ApplicationContext).theme;
  return (
    <BtnSecondary
      onPress={onPress}
      disabled={disabled}
      style={styles.btnSecondaryLarge}>
      <AvaText.ButtonLarge
        textStyle={{
          color: disabled ? theme.colorDisabled : theme.colorPrimary1,
        }}>
        {children}
      </AvaText.ButtonLarge>
    </BtnSecondary>
  );
};

const BtnTextLarge: FC<BaseProps> = ({onPress, disabled, children, style}) => {
  const theme = useContext(ApplicationContext).theme;
  return (
    <BtnText
      onPress={onPress}
      style={[styles.btnTextLarge, style]}
      disabled={disabled}>
      <AvaText.ButtonMedium
        textStyle={{
          color: disabled ? theme.colorDisabled : theme.colorPrimary1,
        }}>
        {children}
      </AvaText.ButtonMedium>
    </BtnText>
  );
};

const BtnTextMedium: FC<BaseProps> = ({onPress, disabled, children}) => {
  const theme = useContext(ApplicationContext).theme;
  return (
    <BtnText onPress={onPress} style={styles.btnTextMedium} disabled={disabled}>
      <AvaText.ButtonSmall
        textStyle={{
          color: disabled ? theme.colorDisabled : theme.colorPrimary1,
        }}>
        {children}
      </AvaText.ButtonSmall>
    </BtnText>
  );
};

const AvaButton = {
  PrimaryLarge: BtnPrimaryLarge,
  PrimaryMedium: BtnPrimaryMedium,
  SecondaryLarge: BtnSecondaryLarge,
  TextLarge: BtnTextLarge,
  TextMedium: BtnTextMedium,
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
    paddingHorizontal: 24,
    paddingVertical: 12,
    width: 'auto',
    height: 48,
  },
  btnPrimaryMedium: {
    paddingHorizontal: 32,
    paddingVertical: 8,
    height: 40,
  },
  btnSecondaryLarge: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: 'auto',
    height: 48,
  },
  btnTextLarge: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  btnTextMedium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});

export default AvaButton;
