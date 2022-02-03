import React, {useEffect, useState} from 'react';
import AvaText from 'components/AvaText';
import InputText from 'components/InputText';
import {Space} from 'components/Space';
import {View} from 'react-native';

const ContactInput = ({
  initName,
  initAddress,
  onNameChange,
  onAddressChange,
}: {
  initName: string;
  initAddress: string;
  onNameChange: (name: string) => void;
  onAddressChange: (address: string) => void;
}) => {
  const [name, setName] = useState(initName);
  const [address, setAddress] = useState(initAddress);

  useEffect(() => {
    onNameChange(name);
  }, [name, onNameChange]);

  useEffect(() => {
    onAddressChange(address);
  }, [address, onAddressChange]);

  return (
    <>
      <AvaText.Body2>Name</AvaText.Body2>
      <Space y={8} />
      <View style={{marginHorizontal: -16}}>
        <InputText
          placeholder={'Enter contact name'}
          text={name}
          onChangeText={text => setName(text)}
        />
      </View>
      <Space y={24} />
      <AvaText.Body2>Address</AvaText.Body2>
      <Space y={8} />
      <View style={{marginHorizontal: -16}}>
        <InputText
          multiline
          placeholder={'Enter the address'}
          text={address}
          onChangeText={text => setAddress(text)}
        />
      </View>
    </>
  );
};

export default ContactInput;
