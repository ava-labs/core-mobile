/* eslint-disable react-hooks/rules-of-hooks */
import React, {ReactElement, useState} from 'react';
import {Dimensions, LayoutChangeEvent, StyleSheet, View} from 'react-native';
import {runOnJS, runOnUI, useSharedValue} from 'react-native-reanimated';

import SortableWord from './SortableWord';
import PhraseContainer from 'screens/onboarding/recovery/components/PhraseContainer';
import {MARGIN_LEFT} from './Layout';

const containerWidth = Dimensions.get('window').width - MARGIN_LEFT * 2;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: MARGIN_LEFT,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    opacity: 0,
  },
});

interface WordListProps {
  children: ReactElement<{id: number}>[];
  onCompleted: (order: number[]) => void;
  isValidPhrase: boolean;
}

const WordList = ({children, onCompleted, isValidPhrase}: WordListProps) => {
  const [ready, setReady] = useState(false);

  /**
   *  Each word is a child, we need to keep track of its order and position.
   *  We use this `offset` object to hold them
   */
  const offsets = children.map(() => ({
    order: useSharedValue(0),
    width: useSharedValue(0),
    height: useSharedValue(0),
    x: useSharedValue(0),
    y: useSharedValue(0),
    originalX: useSharedValue(0),
    originalY: useSharedValue(0),
  }));

  /**
   * While the views are being drawn out, we're collecting their
   * offset values. Once the last child is drawn we set "ready" to true
   * to then render the final component
   */
  if (!ready) {
    return (
      <View style={styles.row}>
        {children.map((child, index) => {
          return (
            <View
              key={index}
              onLayout={({
                nativeEvent: {
                  layout: {x, y, width, height},
                },
              }: LayoutChangeEvent) => {
                const offset = offsets[index]!;
                offset.order.value = -1;
                offset.width.value = width;
                offset.height.value = height;
                offset.originalX.value = x;
                offset.originalY.value = y;
                runOnUI(() => {
                  'worklet';
                  if (offsets.filter(o => o.order.value !== -1).length === 0) {
                    runOnJS(setReady)(true);
                  }
                })();
              }}>
              {child}
            </View>
          );
        })}
      </View>
    );
  }

  /**
   * Once we have all the children's offset values
   * then we render the view bellow.
   */
  return (
    <View style={styles.container}>
      <PhraseContainer isValidPhrase />
      {children.map((child, index) => (
        <SortableWord
          key={index}
          offsets={offsets}
          index={index}
          onCompleted={onCompleted}
          containerWidth={containerWidth}>
          {child}
        </SortableWord>
      ))}
    </View>
  );
};

export default WordList;
