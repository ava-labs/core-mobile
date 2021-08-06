import React, {useState} from 'react';
import {
  ActivityIndicator,
  Appearance,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import CommonViewModel from 'utils/CommonViewModel';
import TextTitle from 'components/TextTitle';
import Header from 'screens/mainView/Header';

type LoaderProps = {
  message: string;
};

export default function Loader(props: LoaderProps | Readonly<LoaderProps>) {
  const [commonViewModel] = useState(
    new CommonViewModel(Appearance.getColorScheme()),
  );
  const [isDarkMode] = useState(commonViewModel.isDarkMode);
  const [backgroundStyle] = useState(commonViewModel.backgroundStyle);

  return (
    <SafeAreaView style={backgroundStyle}>
      <View style={backgroundStyle}>
        <View style={styles.headerContainer}>
          <Header />
        </View>
        <View style={styles.container}>
          <ActivityIndicator
            size="large"
            color={isDarkMode ? Colors.white : Colors.black}
          />
          <TextTitle text={props.message} textAlign={'center'} />
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
