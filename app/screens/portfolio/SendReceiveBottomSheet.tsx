import React, {
  FC,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {ActivityIndicator, Image, StyleSheet, Text, View} from 'react-native';
import {NavigationContainer, useNavigation} from '@react-navigation/native';
import {
  createStackNavigator,
  StackNavigationOptions,
  TransitionPresets,
} from '@react-navigation/stack';
import BottomSheet, {TouchableOpacity} from '@gorhom/bottom-sheet';
import ButtonAva from 'components/ButtonAva';
import AvaLogoSVG from 'components/svg/AvaLogoSVG';
import {ApplicationContext} from 'contexts/ApplicationContext';
import TabViewAva from 'components/TabViewAva';
import CarrotSVG from 'components/svg/CarrotSVG';
import ClearSVG from 'components/svg/ClearSVG';
import TextTitle from 'components/TextTitle';
import AvaListItem from './AvaListItem';
import TabViewBackground from './components/TabViewBackground';
import SendAvax from 'screens/sendAvax/SendAvax';
import {usePortfolio} from 'screens/portfolio/usePortfolio';

const Stack = createStackNavigator();

interface Props {
  symbol?: string;
}

const data: JSON[] = require('assets/coins.json');

const SendReceiveBottomSheet: FC<Props> = props => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const theme = useContext(ApplicationContext).theme;
  const {balanceAvaxTotal, balanceTotalInUSD} = usePortfolio();
  const {goBack, canGoBack} = useNavigation();
  const snapPoints = useMemo(() => ['0%', '86%'], []);

  //todo: figure out types for route params
  const {route} = props;
  const symbol = route.params.symbol;

  const tokenObj: any = data.filter(
    json => json.symbol?.toLowerCase() === symbol?.toLowerCase(),
  )?.[0];

  useEffect(() => {
    // intentionally setting delay so animation is visible.
    setTimeout(() => {
      bottomSheetRef?.current?.snapTo(1);
    }, 50);
  }, []);

  const handleClose = useCallback(() => {
    bottomSheetRef?.current?.collapse();
    // InteractionManager.runAfterInteractions(() => canGoBack() && goBack());
  }, []);

  const handleChange = useCallback(index => {
    if (index === 0 && canGoBack()) {
      goBack();
    }
  }, []);

  const Tabs = () => (
    <>
      <View style={{flexDirection: 'row', paddingRight: 16}}>
        <View style={{flex: 1}}>
          <AvaListItem.Simple
            label={
              <TextTitle
                text={tokenObj?.name ?? ''}
                size={16}
                color={theme.txtListItem}
                bold
              />
            }
            title={
              <TextTitle
                text={balanceAvaxTotal}
                size={24}
                color={theme.txtListItem}
                bold
              />
            }
            subtitle={
              <TextTitle
                text={balanceTotalInUSD}
                size={14}
                color={theme.txtListItemSubscript}
              />
            }
            leftComponent={
              <Image
                style={styles.tokenLogo}
                source={{
                  uri: tokenObj?.image ?? '',
                }}
              />
            }
            titleAlignment={'flex-start'}
          />
        </View>
        <TouchableOpacity onPress={handleClose}>
          <ClearSVG
            color={theme.bgSearch}
            backgroundColor={'#F1F1F4'}
            size={40}
          />
        </TouchableOpacity>
      </View>
      <TabViewAva renderCustomLabel={renderCustomLabel}>
        <SendAvax title={'Send'} />
        <SendAvax title={'Receive'} />
        <SendAvax title={'Activity'} />
      </TabViewAva>
    </>
  );

  const SendNavigator = () => {
    const screenOptions = useMemo<StackNavigationOptions>(
      () => ({
        ...TransitionPresets.SlideFromRightIOS,
        headerShown: true,
        safeAreaInsets: {top: 0},
        headerLeft: ({onPress}) => (
          <TouchableOpacity
            style={{paddingEnd: 16, transform: [{rotate: '180deg'}]}}
            onPress={onPress}>
            <CarrotSVG color={theme.txtOnBgApp} />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity style={{paddingRight: 16}} onPress={handleClose}>
            <ClearSVG
              color={theme.bgSearch}
              backgroundColor={'#F1F1F4'}
              size={40}
            />
          </TouchableOpacity>
        ),
        headerTitleStyle: {
          color: theme.txtListItem,
        },
        headerStyle: {
          backgroundColor: theme.bgOnBgApp,
          shadowColor: theme.transparent,
        },
        cardStyle: {
          backgroundColor: theme.bgOnBgApp,
          overflow: 'visible',
        },
      }),
      [],
    );

    const DoneDoneScreen = () => <DoneScreen onClose={handleClose} />;

    const doneScreenOptions = useMemo(
      () => ({headerShown: false, headerLeft: () => null}),
      [],
    );
    return (
      <NavigationContainer independent={true}>
        <Stack.Navigator screenOptions={screenOptions} headerMode="screen">
          <Stack.Screen
            name="Send Screen"
            options={doneScreenOptions}
            component={Tabs}
          />
          <Stack.Screen name="Confirm Screen" component={ConfirmScreen} />
          <Stack.Screen
            name="Done Screen"
            options={doneScreenOptions}
            component={DoneDoneScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  };

  const renderCustomLabel = (title: string, focused: boolean) => {
    return (
      <View
        style={{
          backgroundColor: focused ? '#FFECEF' : theme.transparent,
          borderRadius: 100,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}>
        <Text
          style={{
            color: focused ? theme.btnTextTxt : '#6C6C6E',
            fontWeight: '600',
            fontSize: 16,
            lineHeight: 24,
          }}>
          {title}
        </Text>
      </View>
    );
  };

  // renders
  return (
    <View style={styles.container}>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        onChange={handleChange}
        backgroundComponent={TabViewBackground}>
        <SendNavigator />
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  tokenLogo: {
    paddingHorizontal: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
});

/**
 * Temporary helper components
 */

const ConfirmScreen: FC = props => {
  const [loading, setLoading] = useState(false);
  const {navigate} = useNavigation();
  return (
    <View style={{justifyContent: 'center', alignItems: 'center', flex: 1}}>
      {loading && <ActivityIndicator />}
      <ButtonAva
        text={'Confirm'}
        onPress={() => {
          setLoading(true);
          setTimeout(() => {
            navigate('Done Screen');
          }, 1000);
        }}
      />
    </View>
  );
};

interface DoneProps {
  onClose: () => void;
}
function DoneScreen({onClose}: DoneProps) {
  return (
    <View style={{justifyContent: 'center', alignItems: 'center', flex: 1}}>
      <AvaLogoSVG />
      <ButtonAva text={'Confirm'} onPress={onClose} />
    </View>
  );
}

export default SendReceiveBottomSheet;
