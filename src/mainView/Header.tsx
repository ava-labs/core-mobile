import React from 'react';
import {ImageBackground, StyleSheet, Text, useColorScheme} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';

const Header: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <ImageBackground
      accessibilityRole="image"
      source={require('../assets/AvaLogo.png')}
      style={[
        styles.background,
        {
          backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
        },
      ]}
      imageStyle={styles.logo}>
      <Text
        style={[
          styles.text,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        Welcome to
        {'\n'}
        Avalanche
      </Text>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    paddingBottom: 0,
    paddingTop: 56,
    paddingHorizontal: 32,
  },
  logo: {
    marginTop: 0,
    height: 50,
    resizeMode: 'contain',
  },
  text: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default Header;
