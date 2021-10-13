import React, {FC, useContext, useEffect, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
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
  const theme = useContext(ApplicationContext).theme;
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
          backgroundColor: theme.bgApp,
        }}>
        <Text style={styles.header}>{title}</Text>
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
      <Collapsible style={{backgroundColor: theme.bgApp}} collapsed={!expanded}>
        {children}
      </Collapsible>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 17,
    color: '#6C6C6E',
  },
});

export default CollapsibleSection;
