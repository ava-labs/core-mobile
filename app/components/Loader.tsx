import React, {useContext} from 'react';
import {ActivityIndicator, SafeAreaView, StyleSheet, View} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import TextTitle from 'components/TextTitle';
import Header from 'screens/mainView/Header';
import {ApplicationContext} from 'contexts/ApplicationContext';

type LoaderProps = {
  message?: string;
  showLogo?: boolean;
};

export default function Loader({message, showLogo = true}: LoaderProps) {
  const context = useContext(ApplicationContext);

  return (
    <SafeAreaView style={context.appBackgroundStyle}>
      <View style={context.backgroundStyle}>
        {showLogo && (
          <View style={styles.headerContainer}>
            <Header />
          </View>
        )}
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
