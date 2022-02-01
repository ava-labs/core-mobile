import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {Animated, Pressable, StyleSheet, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {index} from 'avalanche';
import ActionButtonItem from 'components/ActionButtonItem';

interface Props {
  activeStateChanged: (active: boolean) => void;
  backgroundColor?: string;
  changeBackgroundColor?: string;
  icon?: React.ReactNode;
  iconText?: string;
  iconTextColor?: string;
  changeIconTextColor?: string;
  scale?: number;
  degrees?: number;
  size?: number;
  radius?: number;
}

const FloatingActionButton: FC<Props> = ({
  children,
  activeStateChanged,
  backgroundColor = 'blue',
  changeBackgroundColor = 'blue',
  icon,
  iconText,
  iconTextColor,
  changeIconTextColor,
  scale = 1,
  degrees = 135,
  size = 48,
  radius = 100,
}) => {
  const anim = useRef(new Animated.Value(0)).current;
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    activeStateChanged?.(isActive);
  }, [isActive]);

  const animateItems = useCallback(() => {
    if (isActive) {
      reset();
      return;
    }

    Animated.spring(anim, {
      toValue: 1,
      duration: 250,
    }).start();

    setIsActive(true);
  }, [isActive]);

  const reset = useCallback(() => {
    Animated.spring(anim, {
      toValue: 0,
      duration: 250,
    }).start(() => {
      setIsActive(false);
    });
  }, [isActive]);

  const renderActionItems = useMemo(() => {
    if (!isActive) {
      return null;
    }

    const startDegree = 180;
    const endDegree = 360;
    const startRadian = (startDegree * Math.PI) / 180;
    const endRadian = (endDegree * Math.PI) / 180;

    const childrenCount = React.Children.count(children);
    let offset = 0;
    if (childrenCount !== 1) {
      offset = (endRadian - startRadian) / (childrenCount - 1);
    }

    return React.Children.map(children, (button, index) => {
      return (
        <View
          pointerEvents="box-none"
          style={[
            styles.overlay,
            styles.actionContainer,
            {alignItems: 'center', justifyContent: 'center', top: 100},
          ]}>
          <ActionButtonItem
            key={index}
            position={'center'}
            anim={anim}
            size={48}
            radius={radius}
            angle={startRadian + index * offset}
            btnColor={backgroundColor}
            {...button.props}
            onPress={() => {
              // if (this.props.autoInactive) {
              //   this.timeout = setTimeout(() => {
              //     this.reset();
              //   }, 200);
              // }
              button.props.onPress();
            }}
          />
        </View>
      );
    });
  }, [isActive]);

  const renderButtonIcon = useMemo(() => {
    if (icon) {
      return icon;
    }

    return (
      <Animated.Text
        style={[
          styles.btnText,
          {
            color: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [iconTextColor, changeIconTextColor],
            }),
          },
        ]}>
        {iconText}
      </Animated.Text>
    );
  }, []);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.overlay, {height: 400, top: -100, zIndex: 99999}]}>
      <Animated.View
        pointerEvents={'box-none'}
        style={{
          opacity: anim,
        }}>
        <LinearGradient
          pointerEvents={'box-none'}
          colors={['transparent', '#000000D9', '#000000']}
          style={{
            height: 130,
            bottom: 30,
          }}
        />
        {children && renderActionItems}
      </Animated.View>
      <Pressable
        style={{
          // position: 'absolute',
          alignSelf: 'center',
          justifyContent: 'flex-end',
          top: -65,
        }}
        onPress={() => {
          if (children) {
            animateItems();
          }
        }}>
        <Animated.View
          style={[
            styles.btn,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [backgroundColor, changeBackgroundColor],
              }),
              transform: [
                {
                  scale: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, scale],
                  }),
                },
                {
                  rotate: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', degrees + 'deg'],
                  }),
                },
              ],
            },
          ]}>
          {renderButtonIcon}
        </Animated.View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: 'transparent',
  },
  actionContainer: {
    flexDirection: 'column',
    padding: 10,
  },
  actionBarItem: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  btn: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOpacity: 0.3,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowColor: '#444',
    shadowRadius: 1,
  },
  btnText: {
    marginTop: -4,
    fontSize: 24,
    backgroundColor: 'transparent',
    position: 'relative',
  },
});

export default FloatingActionButton;
