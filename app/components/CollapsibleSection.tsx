import React, {FC, useEffect, useState} from 'react';
import {Animated, Pressable, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaText from 'components/AvaText';
import Collapsible from 'react-native-collapsible';
import CarrotSVG from 'components/svg/CarrotSVG';

interface Props {
  title: React.ReactNode | string;
  startExpanded?: boolean;
}

const CollapsibleSection: FC<Props> = ({
  startExpanded = false,
  title,
  children,
}) => {
  const theme = useApplicationContext().theme;
  const [expanded, setExpanded] = useState<boolean | undefined>(undefined);

  useEffect(() => setExpanded(startExpanded), []);

  const getTitle = () => {
    return typeof title === 'string' ? (
      <Animated.View
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
          padding: 16,
          marginRight: 8,
          backgroundColor: theme.colorBg1,
        }}>
        <AvaText.Body2>{title}</AvaText.Body2>
        <View style={{transform: [{rotate: expanded ? '-90deg' : '90deg'}]}}>
          <CarrotSVG color={theme.txtDim} />
        </View>
      </Animated.View>
    ) : (
      title
    );
  };

  function toggleExpanded() {
    setExpanded(!expanded);
  }
  return (
    <View>
      <Pressable onPress={toggleExpanded}>{getTitle()}</Pressable>
      <Collapsible
        style={{backgroundColor: theme.colorBg1}}
        collapsed={!expanded}>
        {children}
      </Collapsible>
    </View>
  );
};

export default CollapsibleSection;
