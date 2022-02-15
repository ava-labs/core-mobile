import React, {FC} from 'react';
import {
  Animated,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AvaText from './AvaText';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {Space} from 'components/Space';

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
  const {theme} = useApplicationContext();
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
          <>
            <Space y={50} />
            <AvaText.Caption color={theme.white}>{title}</AvaText.Caption>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 2,
    shadowOpacity: 0.3,
    marginHorizontal: 8,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    overflow: 'visible',
    shadowColor: '#444',
    shadowRadius: 1,
    position: 'absolute',
  },
});

export default ActionButtonItem;
