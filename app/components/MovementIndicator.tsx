import React, {FC, useContext} from 'react';
import {StyleSheet, View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import ArrowSVG from 'components/svg/ArrowSVG';

interface Props {
  isNegative?: boolean;
  metric?: number;
}

/***
 * Returns "green", "positve" element by default.
 * Get "red", "negative" element by setting `isNegative`
 * If `metric` is present, it will look at the value
 * passed and ignore `isNegative` if defined.
 * @param isNegative
 * @param metric
 */
const MovementIndicator: FC<Props> = ({isNegative = false, metric}) => {
  const theme = useContext(ApplicationContext).theme;

  const negative = (metric && Math.sign(metric) === -1) ?? isNegative;

  //todo: needs to be updated with theme colors from new color pair from UX
  return (
    <View
      style={[
        styles.tokenLogo,
        {
          backgroundColor: negative ? '#F1595A33' : '#74CD8833',
          transform: [{rotate: negative ? '0deg' : '180deg'}],
        },
      ]}>
      <ArrowSVG color={negative ? '#E6787B' : '#74CD88'} />
    </View>
  );
};

const styles = StyleSheet.create({
  tokenLogo: {
    paddingHorizontal: 16,
    width: 32,
    height: 32,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MovementIndicator;
