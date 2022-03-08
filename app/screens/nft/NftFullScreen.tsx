import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  NativeModules,
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {RouteProp, useRoute} from '@react-navigation/native';
import {NFTStackParamList} from 'navigation/wallet/NFTScreenStack';
import {getColorFromURL} from 'rn-dominant-color';
import LinearGradientSVG from 'components/svg/LinearGradientSVG';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {accelerometer, SensorData} from 'react-native-sensors';
import {filter, sampleTime, tap} from 'rxjs';

export type NftFullScreenProps = {};

const SAMPLE_TIME = 100;

export default function NftFullScreen() {
  const {theme} = useApplicationContext();
  const {params} = useRoute<RouteProp<NFTStackParamList>>();
  const imageUrl = useMemo(() => params!.url, [params]) as string;
  const imageUrlSmall = useMemo(() => params!.urlSmall, [params]) as string;
  const [grabbedBgColor, setGrabbedBgColor] = useState('black');
  const windowWidth = useMemo(() => Dimensions.get('window').width - 32, []);
  const [imageAspect, setImageAspect] = useState(0);

  const [sensorData, setSensorData] = useState({
    x: 0,
    y: 0,
    z: 0,
    timestamp: 0,
  } as SensorData);
  const transformValue = useRef({
    x: new Animated.Value(0),
    z: new Animated.Value(0),
  });
  const diff = useRef({x: 0, z: 0});

  useEffect(() => {
    if (Platform.OS === 'android') {
      const {FullScreenActivity} = NativeModules;
      FullScreenActivity.onCreate();
      return () => {
        FullScreenActivity.onDestroy();
      };
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'ios' && __DEV__) {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return () => {};
    }
    const subscription = accelerometer
      .pipe(
        sampleTime(SAMPLE_TIME),
        filter(
          value =>
            Math.abs(diff.current.x - value.x) > 0.1 ||
            Math.abs(diff.current.z - value.z) > 0.1,
        ),
        tap(sensorData => {
          diff.current.x = sensorData.x;
          diff.current.z = sensorData.z;
        }),
      )
      .subscribe(value => setSensorData(value));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // transformValue.current.x.setValue(prevSensorData?.x ?? 0);
    // transformValue.current.z.setValue(prevSensorData?.z ?? 0);

    Animated.timing(transformValue.current.x, {
      toValue: sensorData.x,
      duration: SAMPLE_TIME - 1,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
    Animated.timing(transformValue.current.z, {
      toValue: sensorData.z,
      duration: SAMPLE_TIME - 1,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [sensorData]);

  useEffect(() => {
    getColorFromURL(imageUrlSmall).then(colors => {
      setGrabbedBgColor(
        Platform.OS === 'ios' ? colors.secondary : colors.background,
      );
    });
  }, [imageUrlSmall]);

  useEffect(() => {
    Image.getSize(imageUrl, (width, height) => setImageAspect(height / width));
  }, [imageUrl]);

  return (
    <View style={[styles.container]}>
      <StatusBar translucent backgroundColor={theme.transparent} />
      <View style={styles.absolute}>
        <LinearGradientSVG
          colorFrom={grabbedBgColor}
          colorTo={grabbedBgColor}
          opacityFrom={0.8}
          opacityTo={0.3}
        />
      </View>
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Animated.View
          style={{
            overflow: Platform.OS === 'ios' ? 'visible' : 'hidden',
            borderRadius: 8,
            elevation: 10,
            shadowColor: 'black',
            shadowRadius: 10,
            shadowOpacity: 0.5,
            shadowOffset: {width: 0, height: 6},
            transform: [
              {
                rotateY: transformValue.current.x.interpolate({
                  inputRange: [-10, 10],
                  outputRange: ['-10deg', '10deg'],
                }),
              },
              {
                rotateX: transformValue.current.z.interpolate({
                  inputRange: [-10, 10],
                  outputRange: ['20deg', '0deg'],
                }),
              },
            ],
          }}>
          <Image
            style={[
              styles.imageStyle,
              {width: windowWidth, height: windowWidth * imageAspect},
            ]}
            source={{uri: imageUrl}}
          />
          <Animated.View
            style={{
              width: 300,
              height: 600,
              position: 'absolute',
              transform: [
                {rotateZ: '-45deg'},
                {translateY: -100},
                {
                  translateX: transformValue.current.z.interpolate({
                    inputRange: [4, 9],
                    outputRange: [-1000, 1500],
                  }),
                },
              ],
            }}>
            <LinearGradientSVG
              orientation={'horizontal'}
              loop={true}
              colorTo={'#ffffff'}
              colorFrom={'#000000'}
              opacityTo={1}
              opacityFrom={0}
            />
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  imgContainer: {
    elevation: 5,
    margin: 16,
    justifyContent: 'space-evenly',
  },
  imageStyle: {
    borderRadius: 8,
    resizeMode: 'contain',
  },
  absolute: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
});
