import React, {FC} from 'react';
import {StyleSheet, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
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
  const theme = useApplicationContext().theme;

  const negative = (metric && Math.sign(metric) === -1) ?? isNegative;

  //todo: needs to be updated with theme colors from new color pair from UX
  return (
    <View
      style={[
        styles.indicator,
        {
          backgroundColor: negative
            ? theme.colorPrimary1Light
            : theme.colorBgGreenLight,
          transform: [{rotate: negative ? '180deg' : '0deg'}],
        },
      ]}>
      <ArrowSVG color={negative ? theme.colorError : theme.colorIcon3} />
    </View>
  );
};

const styles = StyleSheet.create({
  indicator: {
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
