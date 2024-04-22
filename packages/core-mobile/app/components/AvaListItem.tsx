import React from 'react'
import { StyleSheet, Text } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import CarrotSVG from 'components/svg/CarrotSVG'
import AvaText from 'components/AvaText'
import AvaButton from 'components/AvaButton'
import { View } from '@avalabs/k2-mobile'

interface Props {
  rightComponent?: React.ReactNode
  leftComponent?: React.ReactNode
  title?: React.ReactNode | string
  subtitle?: React.ReactNode | string
  showNavigationArrow?: boolean
  disabled?: boolean
  disablePress?: boolean
  onPress?: () => void
  titleAlignment?: 'center' | 'flex-start' | 'flex-end'
  rightComponentHorizontalAlignment?: 'center' | 'flex-start' | 'flex-end'
  rightComponentVerticalAlignment?: 'center' | 'flex-start' | 'flex-end'
  rightComponentMaxWidth?: number | string
  embedInCard?: boolean
  roundedEdges?: boolean
  background?: string
  paddingVertical?: number
  testID?: string
}

function BaseListItem({
  rightComponent,
  leftComponent,
  subtitle,
  title,
  disabled,
  titleAlignment = 'center',
  rightComponentHorizontalAlignment = 'flex-end',
  rightComponentVerticalAlignment = 'flex-start',
  rightComponentMaxWidth = 160,
  showNavigationArrow = false,
  onPress,
  embedInCard,
  background,
  paddingVertical = 4
}: Props): JSX.Element {
  const context = useApplicationContext()

  return (
    <AvaButton.Base
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          paddingVertical: paddingVertical,
          height: 64,
          justifyContent: 'center'
        },
        embedInCard && {
          backgroundColor: context.theme.colorBg2,
          marginHorizontal: 16,
          borderRadius: 8,
          marginVertical: 4
        },
        !!background && {
          backgroundColor: background
        }
      ]}
      testID="baseListItem">
      <View sx={styles.baseRowContainer}>
        <View style={[styles.baseRow, disabled && { opacity: 0.5 }]}>
          {leftComponent && (
            <View sx={{ marginLeft: 16, flexDirection: 'row' }}>
              {leftComponent}
            </View>
          )}
          <View sx={styles.baseMainContent}>
            {typeof title === 'string' ? (
              <AvaText.Heading3 ellipsizeMode="tail">{title}</AvaText.Heading3>
            ) : (
              <View
                style={[
                  styles.baseTitleObject,
                  titleAlignment && { alignItems: titleAlignment }
                ]}>
                {title}
              </View>
            )}
            {!!subtitle && typeof subtitle === 'string' ? (
              <Text
                ellipsizeMode="tail"
                numberOfLines={1}
                style={[
                  styles.baseSubtitle,
                  { color: context.theme.colorText2 }
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
              sx={{
                marginRight: 16,
                flexDirection: 'row',
                maxWidth: rightComponentMaxWidth,
                justifyContent: rightComponentHorizontalAlignment,
                alignSelf: rightComponentVerticalAlignment
              }}>
              {rightComponent}
              {showNavigationArrow && <CarrotSVG />}
            </View>
          )}
        </View>
      </View>
    </AvaButton.Base>
  )
}

function BaseItem(props: Props): JSX.Element {
  return <BaseListItem {...props} />
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
  justifyContent
}: {
  value: React.ReactNode
  currency: React.ReactNode
  justifyContent?: 'flex-start' | 'flex-end' | 'center'
}): JSX.Element {
  return (
    <View
      sx={{
        flexDirection: 'row',
        justifyContent: justifyContent || 'flex-start',
        flexShrink: 1,
        alignItems: 'flex-end'
      }}
      testID="ava_list_item__currency_amount_helper">
      {value}
      {currency}
    </View>
  )
}

// Even tho we only have a single case for now, we'll leave it as is
// so we take advantage of this pattern in the future.
const AvaListItem = {
  Base: BaseItem,
  CurrencyAmount: CurrencyAmountHelper
}

export default AvaListItem

const styles = StyleSheet.create({
  baseRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  baseRow: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1
  },
  baseMainContent: { flex: 1, marginLeft: 16 },
  baseLabel: {
    fontSize: 14,
    lineHeight: 17,
    justifyContent: 'center'
  },
  baseTitleObject: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  baseSubtitle: {
    fontSize: 14,
    lineHeight: 17
  },
  tokenLogo: {
    width: 32,
    height: 32,
    borderRadius: 20,
    overflow: 'hidden'
  },
  tokenItem: {
    marginHorizontal: 8,
    borderRadius: 8,
    marginVertical: 4
  },
  tokenNativeValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    lineHeight: 24
  },
  accountTitleContainer: {
    flexDirection: 'row',
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44
  },
  accountTitleText: {
    paddingRight: 16,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 24
  }
})
