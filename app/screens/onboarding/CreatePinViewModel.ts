import {useEffect, useState} from 'react';
import {PinKeys} from './PinKey';

export type DotView = {
  filled: boolean;
};

const keymap: Map<PinKeys, string> = new Map([
  [PinKeys.Key1, '1'],
  [PinKeys.Key2, '2'],
  [PinKeys.Key3, '3'],
  [PinKeys.Key4, '4'],
  [PinKeys.Key5, '5'],
  [PinKeys.Key6, '6'],
  [PinKeys.Key7, '7'],
  [PinKeys.Key8, '8'],
  [PinKeys.Key9, '9'],
  [PinKeys.Key0, '0'],
]);

export function useCreatePin(
  isResettingPin = false,
): [
  string,
  string,
  DotView[],
  (pinKey: PinKeys) => void,
  (pinKey: PinKeys) => void,
  boolean,
  string | undefined,
] {
  const [title, setTitle] = useState('Create Pin');
  const [errorMessage, setErrorMessage] = useState('');
  const [chosenPin, setChosenPin] = useState('');
  const [confirmedPin, setConfirmedPin] = useState('');
  const [pinDots, setPinDots] = useState<DotView[]>([]);
  const [chosenPinEntered, setChosenPinEntered] = useState(false);
  const [confirmedPinEntered, setConfirmedPinEntered] = useState(false);
  const [validPin, setValidPin] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (chosenPinEntered) {
      setPinDots(getPinDots(confirmedPin));
    } else {
      setPinDots(getPinDots(chosenPin));
    }
  }, [chosenPin, confirmedPin, chosenPinEntered]);

  useEffect(() => {
    if (isResettingPin) {
      setTitle(chosenPinEntered ? 'Confirm new Pin' : 'Create new Pin');
    } else {
      setTitle(chosenPinEntered ? 'Confirm Pin' : 'Create Pin');
    }
  }, [chosenPinEntered]);

  function resetConfirmPinProcess() {
    setValidPin(undefined);
    setConfirmedPinEntered(false);
    setConfirmedPin('');
  }

  useEffect(() => {
    if (chosenPinEntered && confirmedPinEntered) {
      if (chosenPin === confirmedPin) {
        setValidPin(chosenPin);
      } else {
        setErrorMessage('Pins dont match');
        resetConfirmPinProcess();
      }
    }
  }, [chosenPinEntered, confirmedPinEntered]);

  const getPinDots = (pin: string): DotView[] => {
    const dots: DotView[] = [];
    for (let i = 0; i < 6; i++) {
      if (i < pin.length) {
        dots.push({filled: true});
      } else {
        dots.push({filled: false});
      }
    }
    return dots;
  };

  const onEnterChosenPin = (pinKey: PinKeys): void => {
    if (pinKey === PinKeys.Backspace) {
      setChosenPin(chosenPin.slice(0, -1));
    } else {
      if (chosenPin.length === 6) {
        return;
      }
      const newPin = chosenPin + keymap.get(pinKey)!;
      setChosenPin(newPin);
      if (newPin.length === 6) {
        setTimeout(() => {
          setChosenPinEntered(true);
        }, 300);
      }
    }
  };

  const onEnterConfirmedPin = (pinKey: PinKeys): void => {
    setErrorMessage('');
    if (pinKey === PinKeys.Backspace) {
      setConfirmedPin(confirmedPin.slice(0, -1));
    } else {
      if (confirmedPin.length === 6) {
        return;
      }
      const newPin = confirmedPin + keymap.get(pinKey)!;
      setConfirmedPin(newPin);
      if (newPin.length === 6) {
        setConfirmedPinEntered(true);
      }
    }
  };

  return [
    title,
    errorMessage,
    pinDots,
    onEnterChosenPin,
    onEnterConfirmedPin,
    chosenPinEntered,
    validPin,
  ];
}
