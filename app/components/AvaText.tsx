import React, {FC, useContext} from 'react';
import {StyleProp, StyleSheet, Text, TextStyle} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';

interface TextProps {
  textStyle?: StyleProp<TextStyle>;
}

const TextHeading2: FC<TextProps> = ({textStyle, children}) => {
  const theme = useContext(ApplicationContext).theme;
  return (
    <Text style={[styles.heading2, {color: theme.txtListItem}, textStyle]}>
      {children}
    </Text>
  );
};

const TextBody1: FC<TextProps> = ({textStyle, children}) => {
  const theme = useContext(ApplicationContext).theme;
  return (
    <Text style={[styles.body2, {color: theme.txtDim}, textStyle]}>
      {children}
    </Text>
  );
};

const TextBody2: FC<TextProps> = ({textStyle, children}) => {
  const theme = useContext(ApplicationContext).theme;
  return (
    <Text style={[styles.body2, {color: theme.txtDim}, textStyle]}>
      {children}
    </Text>
  );
};

const TextTag: FC<TextProps> = ({textStyle, children}) => {
  const theme = useContext(ApplicationContext).theme;
  return (
    <Text style={[styles.textTag, {color: theme.txtListItem}, textStyle]}>
      {children}
    </Text>
  );
};

const AvaText = {
  Heading2: TextHeading2,
  Body1: TextBody1,
  Body2: TextBody2,
  Tag: TextTag,
};

const styles = StyleSheet.create({
  heading2: {
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 22,
  },
  body1: {
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
  },
  body2: {
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 17,
  },
  textTag: {
    fontWeight: 'bold',
    fontSize: 16,
    lineHeight: 24,
  },
});

export default AvaText;
