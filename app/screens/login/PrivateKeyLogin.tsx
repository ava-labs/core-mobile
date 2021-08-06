import React, {useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import Header from 'screens/mainView/Header';
import TextTitle from 'components/TextTitle';
import InputText from 'components/InputText';
import ButtonAva from 'components/ButtonAva';

type Props = {
  onEnterSingletonWallet: (privateKey: string) => void;
  onBack: () => void;
};

export default function PrivateKeyLogin(props: Props | Readonly<Props>) {
  const [privateKey, setPrivateKey] = useState('PrivateKey-');
  // const [privateKey, setPrivateKey] = useState("27c9f8927ead18895542197939033a79a0060a98011b7ba022ddae33efcf82b5")
  // const [privateKey, setPrivateKey] = useState("PrivateKey-JXMcF4J7JAjVmQeeo9rXSRD8KeJefUFrd2Lgx59rEBN59WN4G")

  const onBack = (): void => {
    props.onBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollView}>
      <View style={styles.verticalLayout}>
        <Header showBack onBack={onBack} />
        <View style={[{height: 8}]} />

        <TextTitle text={'Singleton wallet'} textAlign={'center'} bold={true} />
        <View style={[{height: 8}]} />
        <InputText
          multiline={true}
          onChangeText={text => setPrivateKey(text)}
          value={privateKey}
        />
        <View style={[{flexGrow: 1}]} />
        <ButtonAva
          text={'Enter singleton wallet'}
          onPress={() => props.onEnterSingletonWallet(privateKey)}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    height: '100%',
  },
  verticalLayout: {
    height: '100%',
    justifyContent: 'flex-end',
  },
});
