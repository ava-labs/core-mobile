import React from 'react';
import {ActivityIndicator, SafeAreaView, StyleSheet, View} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import TextTitle from 'components/TextTitle';
import {useApplicationContext} from 'contexts/ApplicationContext';

type LoaderProps = {
  message?: string;
  showLogo?: boolean;
};

export default function Loader({message}: LoaderProps): JSX.Element {
  const context = useApplicationContext();

  return (
    <SafeAreaView style={context.appBackgroundStyle}>
      <View style={context.backgroundStyle}>
        <View style={styles.container}>
          <ActivityIndicator
            size="large"
            color={context.isDarkMode ? Colors.white : Colors.black}
          />
          {!!message && <TextTitle text={message} textAlign={'center'} />}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  headerContainer: {
    width: '100%',
    top: 0,
  },
});
