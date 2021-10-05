import React, {useContext} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import CarrotSVG from 'components/svg/CarrotSVG';

interface Props {
  rightComponent?: React.ReactNode;
  leftComponent?: React.ReactNode;
  label?: React.ReactNode | string;
  title?: React.ReactNode | string;
  subtitle?: React.ReactNode | string;
  showNavigationArrow?: boolean;
  listPressDisabled?: boolean;
  onPress?: () => void;
  titleAlignment?: 'center' | 'flex-start' | 'flex-end';
}

function BaseListItem({
  rightComponent,
  leftComponent,
  subtitle,
  label,
  title,
  listPressDisabled,
  titleAlignment = 'center',
  showNavigationArrow = false,
  onPress,
}: Props) {
  const context = useContext(ApplicationContext);

  return (
    <View style={{paddingVertical: 16}}>
      <TouchableOpacity
        style={styles.baseRowContainer}
        disabled={listPressDisabled}
        onPress={onPress}>
        <View style={styles.baseRow}>
          <View style={{marginLeft: 16, flexDirection: 'row'}}>
            {leftComponent && leftComponent}
          </View>
          <View style={styles.baseMainContent}>
            {!!label && typeof label === 'string' ? (
              <Text
                style={[
                  styles.baseLabel,
                  {color: context.theme.txtListItemSuperscript},
                ]}>
                {label}
              </Text>
            ) : (
              <View>{label}</View>
            )}
            <>
              {typeof title === 'string' ? (
                <Text
                  style={[
                    styles.baseTitleText,
                    {color: context.theme.txtListItem},
                  ]}>
                  {title}
                </Text>
              ) : (
                <View
                  style={[
                    styles.baseTitleObject,
                    titleAlignment && {alignItems: titleAlignment},
                  ]}>
                  {title}
                </View>
              )}
            </>
            {!!subtitle || typeof subtitle === 'string' ? (
              <Text
                ellipsizeMode="middle"
                numberOfLines={1}
                style={[
                  styles.baseSubtitle,
                  {color: context.theme.txtListItemSubscript},
                ]}>
                {subtitle}
              </Text>
            ) : (
              <View>{subtitle}</View>
            )}
          </View>
          <View style={{marginRight: 16, flexDirection: 'row'}}>
            {rightComponent && rightComponent}
            {showNavigationArrow && <CarrotSVG />}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function BaseItem(props: Props) {
  return <BaseListItem {...props} />;
}

// Even tho we only have a single case for now, we'll leave it as is
// so we take advantage of this pattern in the future.
const AvaListItem = {
  Base: BaseItem,
};

export default AvaListItem;

const styles = StyleSheet.create({
  baseRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  baseRow: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  baseMainContent: {paddingHorizontal: 16, flex: 1},
  baseLabel: {
    fontSize: 14,
    lineHeight: 17,
    justifyContent: 'center',
  },
  baseTitleText: {
    fontSize: 16,
    lineHeight: 24,
  },
  baseTitleObject: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  baseSubtitle: {
    fontSize: 14,
    lineHeight: 17,
  },
  tokenLogo: {
    paddingHorizontal: 16,
    width: 32,
    height: 32,
    borderRadius: 20,
    overflow: 'hidden',
  },
  tokenItem: {
    marginHorizontal: 8,
    borderRadius: 8,
    marginVertical: 4,
  },
  tokenNativeValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    lineHeight: 24,
  },
  tokenUsdValue: {
    fontSize: 14,
    lineHeight: 17,
  },
  accountTitleContainer: {
    flexDirection: 'row',
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  accountTitleText: {
    paddingRight: 16,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 24,
  },
});
