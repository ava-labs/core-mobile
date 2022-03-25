import React, {useEffect, useRef} from 'react';
import {Animated, Easing, View} from 'react-native';
import CoreXLogoAnimated from 'components/CoreXLogoAnimated';
import CoreSVG from 'components/svg/CoreSVG';

const AnimatedCoreXLogo = ({finalState}: {finalState?: boolean}) => {
  const animTranslateX = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animTranslateX, {
      toValue: -82,
      duration: finalState ? 0 : 600,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.ease),
      delay: finalState ? 0 : 3000,
    }).start();
  }, []);

  const animWidth = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: 220,
      duration: finalState ? 0 : 840,
      useNativeDriver: false,
      easing: Easing.inOut(Easing.ease),
      delay: finalState ? 0 : 3000,
    }).start();
  }, []);
  return (
    <View
      style={{
        alignItems: 'center',
        minHeight: 400,
        justifyContent: 'center',
      }}>
      <Animated.View
        style={{
          position: 'absolute',
          overflow: 'hidden',
          alignItems: 'center',
          width: animWidth,
        }}>
        <View style={{marginLeft: 50}}>
          <CoreSVG />
        </View>
      </Animated.View>
      <Animated.View
        style={{
          transform: [
            {
              translateX: animTranslateX,
            },
          ],
        }}>
        <CoreXLogoAnimated finalState={finalState} size={65} />
      </Animated.View>
    </View>
  );
};

export default AnimatedCoreXLogo;
