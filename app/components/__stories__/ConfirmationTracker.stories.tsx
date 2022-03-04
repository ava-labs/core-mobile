import {storiesOf} from '@storybook/react-native';
import React, {FC, useEffect, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import ConfirmationTracker from 'screens/bridge/ConfirmationTracker';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'black',
  },
});

storiesOf('Confirmation Tracker', module)
  .add('SingleConfirmation', () => <SingleContainer />)
  .add('Multiple Confirmations', () => <MultipleContainer />);

/**
 * Use Container if need to access hooks prior to calling component. Otherwise just use component directly. See other
 * component stories for examples.
 * @constructor
 */
const MultipleContainer: FC = () => {
  const theme = useApplicationContext().theme;
  const [testStep, setTestStep] = useState(0);
  const requiredSteps = 4;

  useEffect(() => {
    let counter = 0;
    const interval = setInterval(() => {
      counter++;
      if (counter % 5) {
        const nextStep = testStep + 1;
        setTestStep(nextStep);
      }

      if (testStep === 15) {
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [testStep]);

  return (
    <View style={styles.container}>
      <Pressable onPress={() => setTestStep(0)}>
        <AvaText.Heading3>Press to reset</AvaText.Heading3>
      </Pressable>
      <Space y={32} />
      <View
        style={{
          backgroundColor: theme.colorBg2,
          borderRadius: 10,
          overflow: 'hidden',
        }}>
        <ConfirmationTracker
          started={true}
          requiredCount={requiredSteps}
          currentCount={testStep}
        />
      </View>
    </View>
  );
};

const SingleContainer: FC = () => {
  const theme = useApplicationContext().theme;
  const [testStep, setTestStep] = useState(0);
  const requiredSteps = 1;

  return (
    <View style={styles.container}>
      <Pressable onPress={() => setTestStep(0)}>
        <AvaText.Heading3>Press to reset</AvaText.Heading3>
      </Pressable>
      <Space y={32} />
      <View
        style={{
          backgroundColor: theme.colorBg2,
          borderRadius: 10,
          paddingHorizontal: 16,
          overflow: 'hidden',
        }}>
        <ConfirmationTracker
          started={true}
          requiredCount={requiredSteps}
          currentCount={testStep}
        />
      </View>
    </View>
  );
};
