import React, {FC} from 'react';
import {
  Animated,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Props {
  angle?: number;
  radius?: number;
  buttonColor?: string;
  onPress?: () => void;
  children?: React.ReactNode;
  startDegree?: number;
  endDegree?: number;
  style?: StyleProp<any>;
  activeStyle?: StyleProp<any>;
  active?: boolean;
  title?: string;
}

const ActionButtonItem: FC<Props> = ({
  radius = 100,
  angle = 0,
  anim,
  size,
  startDegree = 0,
  endDegree = 720,
  active = false,
  activeOpacity,
  onPress,
  buttonColor,
  style,
  activeStyle,
  title,
  children,
  ...rest
}) => {
  const offsetX = radius * Math.cos(angle);
  const offsetY = radius * Math.sin(angle);
  return (
    <Animated.View
      style={[
        {
          opacity: anim,
          width: size,
          height: size,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, offsetY],
              }),
            },
            {
              translateX: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, offsetX],
              }),
            },
            {
              rotate: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [`${startDegree}deg`, `${endDegree}deg`],
              }),
            },
            {
              scale: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
            },
          ],
        },
      ]}>
      <TouchableOpacity
        {...rest}
        style={{flex: 1, alignItems: 'center'}}
        activeOpacity={activeOpacity || 0.85}
        onPress={onPress}>
        <View
          style={[
            styles.actionButton,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: buttonColor,
            },
            style,
            active ? activeStyle : undefined,
          ]}>
          {children}
        </View>
        {title && (
          <Text style={{top: 50, fontSize: 12, color: 'white'}}>{title}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingTop: 2,
    shadowOpacity: 0.3,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowColor: '#444',
    shadowRadius: 1,
    backgroundColor: 'red',
    position: 'absolute',
  },
});

export default ActionButtonItem;
