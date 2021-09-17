import React, {useContext, useState} from 'react';
import {Modal, StyleSheet, View} from 'react-native';
import Header from 'screens/mainView/Header';
import ButtonAva from 'components/ButtonAva';
import Validate from './Validate';
import TextTitle from 'components/TextTitle';
import {ApplicationContext} from 'contexts/ApplicationContext';

export default function EarnView() {
  const context = useContext(ApplicationContext);
  const [validateVisible, setValidateVisible] = useState(false);

  return (
    <View style={[styles.container, {backgroundColor: context.theme.bgApp}]}>
      <Header />
      <TextTitle text={'Earn'} />
      <View style={styles.buttons}>
        <ButtonAva text={'Validate'} onPress={() => setValidateVisible(true)} />
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        onRequestClose={() => setValidateVisible(false)}
        visible={validateVisible}>
        <Validate onClose={() => setValidateVisible(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    paddingBottom: 88,
  },
  buttons: {
    height: '100%',
    justifyContent: 'flex-end',
  },
});
