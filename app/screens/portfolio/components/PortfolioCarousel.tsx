import React, {useEffect, useRef, useState} from 'react';
import {Animated, Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView,} from 'react-native';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const screenWidth = Dimensions.get('screen').width;
const carouselWidth = screenWidth * 0.85;
const leftOverWidth = screenWidth * 0.15;

interface Props {
  index: number;
}

function PortfolioCarousel({index}: Props) {
  const horizontalScrollViewRef = useRef<ScrollView>();
  const [scrollX] = useState(new Animated.Value(0));

  function scrollDidEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const offset = event.nativeEvent.contentOffset;
    console.debug('scrollDidEnd:' + Math.round(offset.x / carouselWidth));
  }

  useEffect(() => {
    horizontalScrollViewRef?.current?.scrollTo?.({
      x: carouselWidth * index,
      y: 0,
      animated: true,
    });
  }, [horizontalScrollViewRef.current]);

  return (
    <AnimatedScrollView
      decelerationRate="fast"
      disableIntervalMomentum
      horizontal
      onMomentumScrollEnd={scrollDidEnd}
      ref={horizontalScrollViewRef}
      removeClippedSubviews
      scrollEventThrottle={16}
      showsHorizontalScrollIndicator={false}
      snapToInterval={carouselWidth}
      style={{
        paddingHorizontal: leftOverWidth / 2,
      }}
      contentContainerStyle={{
        width: carouselWidth * 2 + leftOverWidth,
      }}>
      {() => {
        const scrollLeft = carouselWidth * -1;
        const scrollMiddle = 0;
        const scrollEnd = carouselWidth;

        return (
          <Animated.View
            key="some key"
            style={{
              paddingHorizontal: leftOverWidth / 4,
              width: carouselWidth,
              transform: [
                {
                  translateX: scrollX?.interpolate({
                    inputRange: [
                      scrollLeft - 1,
                      scrollLeft,
                      scrollMiddle,
                      scrollEnd,
                      scrollEnd + 1,
                    ],
                    outputRange: [
                      -leftOverWidth * 0.9,
                      -leftOverWidth * 0.9,
                      0,
                      leftOverWidth * 0.9,
                      leftOverWidth * 0.9,
                    ],
                  }),
                },
              ],
            }}
          />
        );
      }}
    </AnimatedScrollView>
  );
}

export default PortfolioCarousel;
