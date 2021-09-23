import React, {FC, useContext} from 'react';
import {StyleProp, StyleSheet, Text, TextStyle} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';

interface TextProps {
  textStyle?: StyleProp<TextStyle>;
}

const TextHeading1: FC<TextProps> = ({textStyle, children}) => {
  const theme = useContext(ApplicationContext).theme;
  return (
    <Text style={[styles.heading1, {color: theme.txtListItem}, textStyle]}>
      {children}
    </Text>
  );
};

const TextHeading2: FC<TextProps> = ({textStyle, children}) => {
  const theme = useContext(ApplicationContext).theme;
  return (
    <Text style={[styles.heading2, {color: theme.txtListItem}, textStyle]}>
      {children}
    </Text>
  );
};

const TextHeading3: FC<TextProps> = ({textStyle, children}) => {
  const theme = useContext(ApplicationContext).theme;
  return (
    <Text style={[styles.heading3, {color: theme.txtListItem}, textStyle]}>
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
  Heading1: TextHeading1,
  Heading2: TextHeading2,
  Heading3: TextHeading3,
  Body1: TextBody1,
  Body2: TextBody2,
  Tag: TextTag,
};

const styles = StyleSheet.create({
  heading1: {
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 29,
  },
  heading2: {
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 22,
  },
  heading3: {
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
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
