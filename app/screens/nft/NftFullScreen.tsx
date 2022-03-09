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
import {orientation, OrientationData} from 'react-native-sensors';
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
    pitch: 0,
    roll: 0,
  } as OrientationData);
  const transformValue = useRef({
    pitch: new Animated.Value(0),
    roll: new Animated.Value(0),
  });
  const diff = useRef({pitch: 0, roll: 0});

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

    const subscription = orientation
      .pipe(
        sampleTime(SAMPLE_TIME),
        filter(
          value =>
            Math.abs(diff.current.pitch - value.pitch) > 0.001 ||
            Math.abs(diff.current.roll - value.roll) > 0.001,
        ),
        tap(sensorData => {
          diff.current.pitch = sensorData.pitch;
          diff.current.roll = sensorData.roll;
        }),
      )
      .subscribe(value => {
        setSensorData(value);
      });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // transformValue.current.x.setValue(prevSensorData?.x ?? 0);
    // transformValue.current.z.setValue(prevSensorData?.z ?? 0);

    Animated.timing(transformValue.current.pitch, {
      toValue: sensorData.pitch,
      duration: SAMPLE_TIME - 1,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
    Animated.timing(transformValue.current.roll, {
      toValue: sensorData.roll,
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
                rotateX: transformValue.current.pitch.interpolate({
                  inputRange: [-1.57, 0],
                  outputRange: ['10deg', '-10deg'],
                }),
              },
              {
                rotateY: transformValue.current.roll.interpolate({
                  inputRange: [-0.8, 0.8],
                  outputRange: ['20deg', '-20deg'],
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
                {translateY: 0},
                {scaleY: 1.5},
                {
                  translateX: transformValue.current.pitch.interpolate({
                    inputRange: [-1.57, 0.5],
                    outputRange: [-5000, 5500],
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
