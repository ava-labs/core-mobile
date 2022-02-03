import React, {FC, useMemo, useRef, useState} from 'react';
import {
  FlatList,
  ListRenderItemInfo,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaText from 'components/AvaText';
import CarrotSVG from 'components/svg/CarrotSVG';
import {Popable, PopableManager} from 'react-native-popable';
import Separator from 'components/Separator';
import {BlurView} from '@react-native-community/blur';

interface Props {
  filterOptions: string[];
  title?: string;
  currentItem: string;
  onItemSelected?: (selectedItem: string) => void;
  minWidth?: number;
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
}

/**
 * @param filterOptions Array of string items to be selected
 * @param title If not using icon, title of the filter
 * @param currentItem If not using icon, current filter selection
 * @param onItemSelected selection callback
 * @param minWidth minWidth of Popable
 * @param style Popable style
 * @param icon If used, will replace title and current selected item
 */
const ListFilter: FC<Props> = ({
  filterOptions,
  title,
  currentItem,
  onItemSelected,
  minWidth = 150,
  style,
  icon,
}) => {
  const theme = useApplicationContext().theme;
  const ref = useRef<PopableManager>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const blurBackground = useMemo(() => {
    return (
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType={'dark'}
        blurAmount={10}
        reducedTransparencyFallbackColor={'black'}
      />
    );
  }, []);

  const renderItem = (item: ListRenderItemInfo<string>) => {
    return (
      <AvaText.Body1
        textStyle={{paddingVertical: 8}}
        onPress={() => {
          onItemSelected?.(item.item);
          ref?.current?.hide();
          setIsFilterOpen(!isFilterOpen);
        }}>
        {item.item}
      </AvaText.Body1>
    );
  };

  function filterContent() {
    return (
      <>
        {blurBackground}
        <FlatList
          data={filterOptions}
          renderItem={renderItem}
          contentContainerStyle={{paddingHorizontal: 16}}
          ItemSeparatorComponent={Separator}
        />
      </>
    );
  }

  return (
    <Popable
      ref={ref}
      content={filterContent()}
      action={'press'}
      onAction={setIsFilterOpen}
      position={'bottom'}
      style={[
        {
          minWidth: minWidth,
          marginTop: -10,
        },
        style,
      ]}
      backgroundColor={theme.transparent}>
      <View style={{padding: 16, flexDirection: 'row'}}>
        {icon ? (
          <View>{icon}</View>
        ) : (
          <>
            <AvaText.ButtonSmall
              textStyle={{color: theme.colorText1, paddingEnd: 4}}>
              {title && title + ': '}
              {currentItem}
            </AvaText.ButtonSmall>
            <CarrotSVG
              direction={isFilterOpen ? 'up' : 'down'}
              color={theme.colorText1}
            />
          </>
        )}
      </View>
    </Popable>
  );
};

export default ListFilter;
