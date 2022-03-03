import {storiesOf} from '@storybook/react-native';
import AvaText from 'components/AvaText';
import React from 'react';
import {StyleSheet, View} from 'react-native';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'black',
  },
});

storiesOf('AvaText', module)
  .add('Examples', () => {
  return (
    <View style={styles.container}>
      <AvaText.Heading1>Heading One</AvaText.Heading1>
      <AvaText.Heading2>Heading Two</AvaText.Heading2>
      <AvaText.Heading3>Heading Three</AvaText.Heading3>
      <AvaText.Body1>Body One</AvaText.Body1>
      <AvaText.Body2>Body Two</AvaText.Body2>
      <AvaText.Body3 color={'gray'}>Body Three</AvaText.Body3>
      <AvaText.Body4 color={'gray'}>Body Four</AvaText.Body4>
      <AvaText.Tag>Tag Text</AvaText.Tag>
      <AvaText.Caption color={'gray'}>Caption text</AvaText.Caption>
      <AvaText.ButtonSmall color={'white'}>Button small</AvaText.ButtonSmall>
      <AvaText.ButtonMedium color={'white'}>Button medium</AvaText.ButtonMedium>
      <AvaText.ButtonLarge>Button large</AvaText.ButtonLarge>
      <AvaText.LargeTitleBold>Large title bold</AvaText.LargeTitleBold>
      <AvaText.ActivityTotal>Activity total</AvaText.ActivityTotal>
    </View>
  );
});
