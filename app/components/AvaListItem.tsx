import React, {useContext} from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import CarrotSVG from 'components/svg/CarrotSVG';
import SearchSVG from 'components/svg/SearchSVG';
import AvaLogoSVG from 'components/svg/AvaLogoSVG';
import {ApplicationContext} from 'contexts/ApplicationContext';
import MovementIndicator from 'components/MovementIndicator';
import MenuSVG from 'components/svg/MenuSVG';

interface Props {
  rightComponent?: React.ReactNode;
  leftComponent?: React.ReactNode;
  label?: React.ReactNode | string;
  title?: React.ReactNode | string;
  subtitle?: React.ReactNode | string;
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
          {leftComponent && leftComponent}
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
          {rightComponent && rightComponent}
        </View>
      </TouchableOpacity>
    </View>
  );
}

function CustomItem(props: Props) {
  return <BaseListItem {...props} />;
}

interface TokenItemProps {
  tokenName: string;
  tokenPrice: string;
  image?: string;
  symbol?: string;
  onPress?: () => void;
}
function TokenItem({
  tokenName,
  tokenPrice,
  image,
  symbol,
  onPress,
}: TokenItemProps) {
  const title = tokenName;
  const context = useContext(ApplicationContext);

  let tokenLogo = <Image style={styles.tokenLogo} source={{uri: image}} />;
  if (symbol === 'AVAX') {
    tokenLogo = (
      <AvaLogoSVG
        size={32}
        logoColor={context.theme.logoColor}
        backgroundColor={context.theme.txtOnBgApp}
      />
    );
  }

  const info = (
    <View style={{alignItems: 'flex-end'}}>
      <Text
        style={[styles.tokenNativeValue, {color: context.theme.txtListItem}]}>
        {`${tokenPrice} ${symbol?.toUpperCase()}`}
      </Text>
      <Text
        style={[
          styles.tokenUsdValue,
          {color: context.theme.txtListItemSubscript},
        ]}>
        {`${tokenPrice} USD`}
      </Text>
    </View>
  );

  return (
    <View
      style={[
        styles.tokenItem,
        context.shadow,
        {backgroundColor: context.theme.bgOnBgApp},
      ]}>
      <BaseListItem
        title={title}
        leftComponent={tokenLogo}
        rightComponent={info}
        onPress={onPress}
      />
    </View>
  );
}

interface AccountItemProps {
  accountName?: string;
  accountAddress?: string;
  onRightComponentPress?: () => void;
  onLeftComponentPress?: () => void;
  onAccountPressed: () => void;
}
function AccountItem({
  accountName = 'Account 1',
  onAccountPressed,
  onRightComponentPress,
  onLeftComponentPress,
}: AccountItemProps) {
  const context = useContext(ApplicationContext);

  const leftComponent = (
    <TouchableOpacity onPress={onLeftComponentPress}>
      <MenuSVG />
    </TouchableOpacity>
  );

  const rightComponent = (
    <TouchableOpacity onPress={onRightComponentPress}>
      <SearchSVG />
    </TouchableOpacity>
  );

  function buildTitle() {
    return (
      <TouchableWithoutFeedback onPress={onAccountPressed}>
        <View
          style={[
            styles.accountTitleContainer,
            {borderColor: context.theme.btnIconBorder},
          ]}>
          <Text
            style={[
              styles.accountTitleText,
              {color: context.theme.txtListItem},
            ]}
            ellipsizeMode="middle"
            numberOfLines={1}>
            {accountName}
          </Text>
          <View style={{transform: [{rotate: '90deg'}]}}>
            <CarrotSVG color={context.theme.txtListItem} size={10} />
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  return (
    <BaseListItem
      leftComponent={leftComponent}
      title={buildTitle()}
      rightComponent={rightComponent}
      listPressDisabled
    />
  );
}

type ActivityItemProps = {
  balance: number;
  movement?: number;
} & TokenItemProps;

function ActivityItem({
  tokenName,
  tokenPrice,
  symbol,
  balance,
  movement,
  onPress,
}: ActivityItemProps) {
  const context = useContext(ApplicationContext);

  const rightComponent = (
    <View style={{alignItems: 'flex-end'}}>
      <Text
        style={[styles.tokenNativeValue, {color: context.theme.txtListItem}]}>
        {`${tokenPrice} ${symbol?.toUpperCase()}`}
      </Text>
      <Text
        style={[
          styles.tokenUsdValue,
          {color: context.theme.txtListItemSubscript},
        ]}>
        {`${tokenPrice} USD`}
      </Text>
    </View>
  );

  return (
    <View
      style={[
        styles.tokenItem,
        context.shadow,
        {backgroundColor: context.theme.bgOnBgApp},
      ]}>
      <BaseListItem
        title={tokenName}
        subtitle={`Bal: ${balance}`}
        leftComponent={<MovementIndicator metric={movement} />}
        rightComponent={rightComponent}
        onPress={onPress}
      />
    </View>
  );
}

const AvaListItem = {
  Token: TokenItem,
  Account: AccountItem,
  Activity: ActivityItem,
  Custom: CustomItem,
};

export default AvaListItem;

const styles = StyleSheet.create({
  baseRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
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
    fontWeight: 'bold',
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
    fontWeight: '600',
    lineHeight: 24,
  },
});
