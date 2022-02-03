import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import CarrotSVG from 'components/svg/CarrotSVG';

interface Props {
  rightComponent?: React.ReactNode;
  leftComponent?: React.ReactNode;
  label?: React.ReactNode | string;
  title?: React.ReactNode | string;
  subtitle?: React.ReactNode | string;
  showNavigationArrow?: boolean;
  disabled?: boolean;
  disablePress?: boolean;
  onPress?: () => void;
  titleAlignment?: 'center' | 'flex-start' | 'flex-end';
  rightComponentAlignment?: 'center' | 'flex-start' | 'flex-end';
  embedInCard?: boolean;
  roundedEdges?: boolean;
  background?: string;
  paddingVertical?: number;
}

function BaseListItem({
  rightComponent,
  leftComponent,
  subtitle,
  label,
  title,
  disabled,
  disablePress,
  titleAlignment = 'center',
  rightComponentAlignment = 'flex-end',
  showNavigationArrow = false,
  onPress,
  embedInCard,
  background,
  paddingVertical = 4,
}: Props) {
  const context = useApplicationContext();

  return (
    <View
      style={[
        {
          paddingVertical: paddingVertical,
          height: 64,
          justifyContent: 'center',
        },
        embedInCard && {
          backgroundColor: context.theme.listItemBg,
          marginHorizontal: 16,
          borderRadius: 8,
        },
        !!background && {
          backgroundColor: background,
        },
      ]}>
      <Pressable
        pointerEvents={disablePress ? 'none' : 'auto'}
        style={styles.baseRowContainer}
        disabled={disabled}
        onPress={onPress}>
        <View style={[styles.baseRow, disabled && {opacity: 0.5}]}>
          {leftComponent && (
            <View style={{marginLeft: 8, flexDirection: 'row'}}>
              {leftComponent}
            </View>
          )}
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
            {!!subtitle && typeof subtitle === 'string' ? (
              <Text
                ellipsizeMode="tail"
                numberOfLines={1}
                style={[
                  styles.baseSubtitle,
                  {color: context.theme.txtListItemSubscript},
                ]}>
                {subtitle}
              </Text>
            ) : subtitle ? (
              <View>{subtitle}</View>
            ) : undefined}
          </View>
          {/* right element only rendered if component not undefined or showNavigation Error is true.
            It now utilizes flexGrow which will allow us to align items in the space as per UX requirements.
           */}
          {(rightComponent || showNavigationArrow) && (
            <View
              style={{
                marginRight: 8,
                flexDirection: 'row',
                maxWidth: 150,
                flexGrow: 1,
                justifyContent: rightComponentAlignment,
                alignSelf: 'flex-start',
              }}>
              {rightComponent}
              {showNavigationArrow && <CarrotSVG />}
            </View>
          )}
          {/*))}*/}
        </View>
      </Pressable>
    </View>
  );
}

function BaseItem(props: Props) {
  return <BaseListItem {...props} />;
}

/**
 * This component helps ellipsize amount if there's no enough space but keeps currency fully visible.
 * Amount component must use ellipsize for this purpose.
 *
 * @param value - component displaying value, should be ellipsizable
 * @param currency - component displaying currency
 */
function CurrencyAmountHelper({
  value,
  currency,
  justifyContent,
}: {
  value: React.ReactNode;
  currency: React.ReactNode;
  justifyContent?: 'flex-start' | 'flex-end' | 'center';
}): JSX.Element {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: justifyContent || 'flex-start',
        flexShrink: 1,
        alignItems: 'flex-end',
      }}>
      {value}
      {currency}
    </View>
  );
}

// Even tho we only have a single case for now, we'll leave it as is
// so we take advantage of this pattern in the future.
const AvaListItem = {
  Base: BaseItem,
  CurrencyAmount: CurrencyAmountHelper,
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
  baseMainContent: {flex: 1, marginLeft: 8},
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
