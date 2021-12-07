import React from 'react';
import {View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';

export default function ModalContainer({children}: {children: any}) {
  const {theme} = useApplicationContext();

  return (
    <View
      style={{
        height: '100%',
        justifyContent: 'center',
        backgroundColor: theme.overlay,
      }}>
      <View
        style={[
          {
            borderRadius: 8,
            backgroundColor: theme.colorBg2,
            padding: 16,
            marginHorizontal: 16,
            marginVertical: 16,
            justifyContent: 'center',
            bottom: 0,
          },
        ]}>
        {children}
      </View>
    </View>
  );
}
