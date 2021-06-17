import React, {FC} from 'react';
import {ImageBackground, StyleSheet, useColorScheme} from 'react-native';

const Header: FC = () => {
  const isDarkMode: boolean = useColorScheme() === 'dark';
  return (
    <ImageBackground
      accessibilityRole="image"
      source={require('../assets/AvaLogo.png')}
      style={[
        styles.background,
      ]}
      imageStyle={styles.logo}>
    </ImageBackground>
  );
};

const styles: any = StyleSheet.create({
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
