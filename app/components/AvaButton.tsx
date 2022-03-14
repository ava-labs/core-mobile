import React, {FC, ReactNode} from 'react';
import {Pressable, StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaText from './AvaText';
import {Space} from 'components/Space';

interface BaseProps {
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  rippleBorderless?: boolean;
  textColor?: string;
}

const AvaButtonBase: FC<BaseProps> = ({
  rippleBorderless,
  onPress,
  style,
  disabled,
  children,
}) => {
  const theme = useApplicationContext().theme;
  return (
    <Pressable
      android_ripple={{
        color: theme.buttonRipple,
        borderless: rippleBorderless ?? false,
      }}
      style={style}
      onPress={onPress}
      disabled={disabled}>
      {children}
    </Pressable>
  );
};

const AvaButtonIcon: FC<BaseProps> = ({style, disabled, onPress, children}) => {
  return (
    <AvaButtonBase
      disabled={disabled}
      onPress={onPress}
      rippleBorderless={true}
      style={[styles.buttonIcon, style]}>
      {children}
    </AvaButtonBase>
  );
};

const TextWithIcon: FC<
  BaseProps & {icon: ReactNode; text: ReactNode; gap?: number}
> = ({style, disabled, onPress, icon, text, gap = 8}) => {
  return (
    <AvaButton.Base disabled={disabled} onPress={onPress} style={[style]}>
      <View style={{flexDirection: 'row', alignItems: 'center', margin: 8}}>
        {icon}
        <Space x={gap} />
        {text}
      </View>
    </AvaButton.Base>
  );
};

const BtnPrimary: FC<BaseProps> = ({onPress, disabled, children, style}) => {
  const theme = useApplicationContext().theme;
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
  const theme = useApplicationContext().theme;
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
  const theme = useApplicationContext().theme;
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
  textColor,
}) => {
  const theme = useApplicationContext().theme;
  return (
    <BtnPrimary
      disabled={disabled}
      onPress={onPress}
      style={[styles.btnPrimaryLarge, style]}>
      <AvaText.ButtonLarge
        textStyle={{
          color: disabled ? theme.colorText2 : textColor ?? theme.colorText3,
        }}>
        {children}
      </AvaText.ButtonLarge>
    </BtnPrimary>
  );
};

const BtnPrimaryMedium: FC<BaseProps> = ({onPress, disabled, children}) => {
  const theme = useApplicationContext().theme;
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
  const theme = useApplicationContext().theme;
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
  const theme = useApplicationContext().theme;
  return (
    <BtnText
      onPress={onPress}
      style={[styles.btnTextLarge, style]}
      disabled={disabled}>
      <AvaText.ButtonLarge
        textStyle={{
          color: disabled ? theme.colorDisabled : theme.colorPrimary1,
        }}>
        {children}
      </AvaText.ButtonLarge>
    </BtnText>
  );
};

const BtnTextMedium: FC<BaseProps> = ({
  onPress,
  disabled,
  textColor,
  children,
}) => {
  const theme = useApplicationContext().theme;
  return (
    <BtnText onPress={onPress} style={styles.btnTextMedium} disabled={disabled}>
      <AvaText.ButtonSmall
        textStyle={{
          color: disabled
            ? theme.colorDisabled
            : textColor
            ? textColor
            : theme.colorPrimary1,
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
  TextWithIcon: TextWithIcon,
};

const styles = StyleSheet.create({
  buttonIcon: {
    height: 48,
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
  },
  btnPrimaryLarge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    width: 'auto',
    height: 48,
    justifyContent: 'center',
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
