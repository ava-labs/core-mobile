import React, {useContext, useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import PinKey, {PinKeys} from './PinKey';
import Dot from 'components/Dot';
import {useCreatePin} from './CreatePinViewModel';
import TextLabel from 'components/TextLabel';
import HeaderProgress from 'screens/mainView/HeaderProgress';
import {Space} from 'components/Space';
import AvaText from 'components/AvaText';
import {StackActions, useNavigation, useRoute} from '@react-navigation/native';
import AppViewModel from 'AppViewModel';
import AppNavigation from 'navigation/AppNavigation';
import {ApplicationContext} from 'contexts/ApplicationContext';

const keymap: Map<string, PinKeys> = new Map([
  ['1', PinKeys.Key1],
  ['2', PinKeys.Key2],
  ['3', PinKeys.Key3],
  ['4', PinKeys.Key4],
  ['5', PinKeys.Key5],
  ['6', PinKeys.Key6],
  ['7', PinKeys.Key7],
  ['8', PinKeys.Key8],
  ['9', PinKeys.Key9],
  ['0', PinKeys.Key0],
  ['<', PinKeys.Backspace],
]);

type Props = {
  onBack: () => void;
  onPinSet: (pin: string) => void;
};

export default function CreatePIN(props: Props | Readonly<Props>) {
  const route = useRoute();
  const navigation = useNavigation();
  const theme = useContext(ApplicationContext).theme;
  const isChangingPin = route?.params?.isChangingPin;
  const [
    title,
    errorMessage,
    pinDots,
    onEnterChosenPin,
    onEnterConfirmedPin,
    chosenPinEntered,
    validPin,
  ] = useCreatePin();

  useEffect(() => {
    if (validPin) {
      if (isChangingPin) {
        AppViewModel.onPinCreated(validPin, isChangingPin);
        navigation.dispatch(StackActions.pop(2));
      } else {
        props.onPinSet(validPin);
      }
    }
  }, [validPin]);

  const onBack = (): void => {
    props.onBack();
  };

  const generatePinDots = (): Element[] => {
    const dots: Element[] = [];

    pinDots.forEach((value, key) => {
      dots.push(<Dot filled={value.filled} key={key} />);
    });
    return dots;
  };

  const keyboard = (chosenPinEntered: boolean) => {
    const keys: Element[] = [];
    '123456789 0<'.split('').forEach((value, key) => {
      keys.push(
        <View key={key} style={styles.pinKey}>
          <PinKey
            keyboardKey={keymap.get(value)!}
            onPress={chosenPinEntered ? onEnterConfirmedPin : onEnterChosenPin}
          />
        </View>,
      );
    });
    return keys;
  };

  return (
    <View style={[styles.verticalLayout, {backgroundColor: theme.bgApp}]}>
      {isChangingPin || (
        <HeaderProgress maxDots={3} filledDots={3} showBack onBack={onBack} />
      )}
      <Space y={8} />

      <View style={styles.growContainer}>
        <AvaText.Heading1 textStyle={{textAlign: 'center'}}>
          {title}
        </AvaText.Heading1>
        <AvaText.Heading3 textStyle={{textAlign: 'center'}}>
            {isChangingPin ? 'Enter new PIN' : 'Access your wallet faster'}
        </AvaText.Heading3>
        <Space y={8} />

        {errorMessage.length > 0 && <TextLabel text={errorMessage} />}
        <View style={styles.dots}>{generatePinDots()}</View>
      </View>
      <View style={styles.keyboard}>{keyboard(chosenPinEntered)}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  verticalLayout: {
    height: '100%',
    justifyContent: 'flex-end',
  },
  growContainer: {
    flexGrow: 1,
  },
  keyboard: {
    marginHorizontal: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dots: {
    paddingHorizontal: 68,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    flexDirection: 'row',
  },
  pinKey: {
    flexBasis: '33%',
    padding: 16,
  },
});
