import {StackNavigationOptions} from '@react-navigation/stack';
import AvaText from 'components/AvaText';
import React from 'react';

export const MainHeaderOptions = (
  title: string,
  hideHeaderLeft = false,
): Partial<StackNavigationOptions> => {
  return {
    headerTitle: () => <AvaText.Heading1>{title} </AvaText.Heading1>,
    headerTitleAlign: 'left',
    headerLeft: hideHeaderLeft ? () => null : undefined,
    headerBackTitleVisible: false,
  };
};

export const SubHeaderOptions = (
  title: string,
  hideHeaderLeft = false,
): Partial<StackNavigationOptions> => {
  const options = {
    headerTitle: () => <AvaText.Heading1>{title} </AvaText.Heading1>,
    headerTitleAlign: 'center',
    headerLeft: hideHeaderLeft ? () => null : undefined,
    headerBackTitleVisible: false,
  };

  return options;
};
