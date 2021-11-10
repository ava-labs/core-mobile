import {StackNavigationOptions} from '@react-navigation/stack';
import AvaText from 'components/AvaText';
import React from 'react';
import {COLORS_DAY, COLORS_NIGHT} from 'resources/Constants';
import {useApplicationContext} from 'contexts/ApplicationContext';

export const MainHeaderOptions = (
  title: string,
  hideHeaderLeft = false,
  backgroundColor?: string,
): Partial<StackNavigationOptions> => {
  const theme = useApplicationContext().theme;
  return {
    headerShown: true,
    headerTitle: () => <AvaText.Heading1>{title} </AvaText.Heading1>,
    headerTitleAlign: 'left',
    headerLeft: hideHeaderLeft ? () => null : undefined,
    headerBackTitleVisible: false,
    headerStyle: {
      shadowColor: 'transparent',
      backgroundColor: backgroundColor ?? theme.colorBg2,
    },
  };
};

export const SubHeaderOptions = (
  title: string,
  hideHeaderLeft = false,
  backgroundColor?: string,
): Partial<StackNavigationOptions> => {
  const theme = useApplicationContext().theme;
  const options: Partial<StackNavigationOptions> = {
    headerShown: true,
    headerTitle: () => <AvaText.Heading1>{title}</AvaText.Heading1>,
    headerTitleAlign: 'center',
    headerLeft: hideHeaderLeft ? () => null : undefined,
    headerBackTitleVisible: false,
    headerStyle: {
      shadowColor: 'transparent',
      backgroundColor: backgroundColor ?? theme.colorBg2,
    },
  };

  return options;
};
