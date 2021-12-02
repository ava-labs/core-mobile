import React, {FC, ReactNode} from 'react';
import {Pressable, StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaText from './AvaText';
import {Space} from 'components/Space';

type CircularButtonProps = {
  image: ReactNode;
  caption: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
};

export default function CircularButton({
  image,
  caption,
  disabled,
  style,
  onPress,
}: CircularButtonProps) {
  const theme = useApplicationContext().theme;
  return (
    <View style={styles.container}>
      <Pressable
        disabled={disabled}
        onPress={onPress}
        android_ripple={{
          color: theme.buttonRipple,
          borderless: true,
        }}
        style={[styles.circular, {backgroundColor: theme.colorBg1}, style]}>
        {image}
      </Pressable>
      <Space y={8} />
      <AvaText.ButtonSmall>{caption}</AvaText.ButtonSmall>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circular: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    width: 64,
    height: 64,
    borderRadius: 50,
    overflow: 'hidden',
  },
});
