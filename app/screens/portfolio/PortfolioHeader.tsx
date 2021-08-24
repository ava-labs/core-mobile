import React, {useEffect, useState} from 'react';
import {Animated, Dimensions, StyleSheet, Text, View} from 'react-native';
import PagerView, {
  PagerViewOnPageScrollEventData,
} from 'react-native-pager-view';
import ReceiveAssets from 'screens/portfolio/components/ReceiveAssets';
import SearchHeader, {
  SearchHeaderProps,
} from 'screens/portfolio/components/SearchHeader';
import {SlidingDot} from 'react-native-animated-pagination-dots';
import LinearGradient from 'react-native-linear-gradient';
import PortfolioViewModel from 'screens/portfolio/PortfolioViewModel';
import {Subscription} from 'rxjs';

interface PortfolioHeaderProps {
  portfolioViewModel: PortfolioViewModel;
}

type Props = PortfolioHeaderProps & SearchHeaderProps;

function PortfolioHeader({
  portfolioViewModel,
  searchText,
  onSearchTextChanged,
}: Props) {
  const [avaxPrice, setAvaxPrice] = useState(0);
  const [addressX, setAddressX] = useState('');
  const [addressP, setAddressP] = useState('');
  const [addressC, setAddressC] = useState('');

  const width = Dimensions.get('window').width;
  const ref = React.useRef<PagerView>(null);
  const scrollOffsetAnimatedValue = React.useRef(new Animated.Value(0)).current;
  const positionAnimatedValue = React.useRef(new Animated.Value(0)).current;
  const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);
  const inputRange = [0, 2];
  const scrollX = Animated.add(
    scrollOffsetAnimatedValue,
    positionAnimatedValue,
  ).interpolate({
    inputRange,
    outputRange: [0, 2 * width],
  });

  useEffect(() => {
    const disposables = new Subscription();
    disposables.add(
      portfolioViewModel.avaxPrice.subscribe(value => {
        console.log('avaxPrice: ' + value);
        setAvaxPrice(value);
      }),
    );
    disposables.add(
      portfolioViewModel.addressX.subscribe(value => {
        console.log('addressX: ' + value);
        setAddressX(value);
      }),
    );
    disposables.add(
      portfolioViewModel.addressP.subscribe(value => {
        console.log('addressP: ' + value);
        setAddressP(value);
      }),
    );
    disposables.add(
      portfolioViewModel.addressC.subscribe(value => {
        console.log('addressC: ' + value);
        setAddressC(value);
      }),
    );
    portfolioViewModel.onComponentMount();

    return () => {
      disposables.unsubscribe();
      portfolioViewModel.onComponentUnMount();
    };
  }, [portfolioViewModel]);

  const onPageScroll = React.useMemo(
    () =>
      Animated.event<PagerViewOnPageScrollEventData>(
        [
          {
            nativeEvent: {
              offset: scrollOffsetAnimatedValue,
              position: positionAnimatedValue,
            },
          },
        ],
        {
          useNativeDriver: false,
        },
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <LinearGradient colors={['#2700D8', '#C29BF9']}>
      <View
        style={{
          minHeight: 360,
          flex: 1,
          justifyContent: 'space-evenly',
        }}>
        <AnimatedPagerView
          initialPage={0}
          ref={ref}
          style={styles.PagerView}
          onPageScroll={onPageScroll}>
          {/*{INTRO_DATA.map(({key}) => (*/}
          <View key={0} style={styles.center}>
            <Text
              style={{
                fontWeight: 'bold',
                fontSize: 36,
                lineHeight: 44,
                color: 'white',
              }}>
              {`$${avaxPrice} USD`}
            </Text>
          </View>
          <View key={1}>
            <ReceiveAssets
              addressX={addressX}
              addressC={addressC}
              addressP={addressP}
            />
          </View>
          {/*))}*/}
        </AnimatedPagerView>
        <View style={styles.dotContainer}>
          <SlidingDot
            marginHorizontal={3}
            data={[{}, {}]}
            //@ts-ignore
            scrollX={scrollX}
            dotStyle={styles.dot}
            dotSize={8}
            slidingIndicatorStyle={{
              backgroundColor: 'white',
            }}
          />
        </View>
        <SearchHeader
          searchText={searchText}
          onSearchTextChanged={text => {
            onSearchTextChanged(text);
            console.log('search header:' + text);
          }}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    padding: 20,
  },
  dotContainer: {
    justifyContent: 'center',
    alignSelf: 'center',
    flex: 0.2,
    paddingBottom: 16,
  },
  contentSlider: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  dot: {
    backgroundColor: 'white',
  },
  PagerView: {
    flex: 1,
  },
});

export default PortfolioHeader;
