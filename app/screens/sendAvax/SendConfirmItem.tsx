import React, {useContext} from 'react';
import {Image, TouchableOpacity, View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import AccountSVG from 'components/svg/AccountSVG';
import TextTitle from 'components/TextTitle';

interface Props {
  mainComponent?: React.ReactNode;
  leftComponent?: React.ReactNode;
  listPressDisabled?: boolean;
}

function BaseItem({mainComponent, leftComponent, listPressDisabled}: Props) {
  const context = useContext(ApplicationContext);
  return (
    <>
      <TouchableOpacity disabled={listPressDisabled}>
        <View
          style={[
            context.shadow,
            {
              marginVertical: 8,
              padding: 16,
              alignItems: 'center',
              flexDirection: 'row',
              backgroundColor: context.theme.bgOnBgApp,
              borderRadius: 8,
              display: 'flex',
            },
          ]}>
          {leftComponent && (
            <View style={{marginRight: 16}}>{leftComponent}</View>
          )}
          {mainComponent && mainComponent}
        </View>
      </TouchableOpacity>
    </>
  );
}

interface AmountItemProps {
  image: string;
  tokenAmount: string;
  fiatAmount: string;
}

function AmountItem({tokenAmount, fiatAmount, image}: AmountItemProps) {
  const context = useContext(ApplicationContext);

  const tokenLogo = (
    <Image
      style={{width: 32, height: 32}}
      width={32}
      height={32}
      source={{uri: image}}
    />
  );

  const sendAmount = (
    <View style={{flex: 1}}>
      <TextTitle
        text={tokenAmount}
        size={16}
        color={context.theme.txtListItem}
      />
      <TextTitle
        text={fiatAmount}
        size={14}
        color={context.theme.txtListItemSubscript}
      />
    </View>
  );

  return (
    <BaseItem
      leftComponent={tokenLogo}
      mainComponent={sendAmount}
      listPressDisabled={true}
    />
  );
}

interface AddressItemProps {
  address: string;
}

function AddressItem({address}: AddressItemProps) {
  const leftComponent = <AccountSVG />;
  const context = useContext(ApplicationContext);

  function buildTitle() {
    return (
      <View style={{flex: 1}}>
        <TextTitle
          text={address}
          color={context.theme.txtListItem}
          size={16}
          bold
        />
      </View>
    );
  }

  return (
    <BaseItem
      leftComponent={leftComponent}
      mainComponent={buildTitle()}
      listPressDisabled
    />
  );
}

interface MemoItemProps {
  memo: string;
}

function MemoItem({memo}: MemoItemProps) {
  const context = useContext(ApplicationContext);

  const memoComponent = (
    <View style={{flex: 1}}>
      <TextTitle
        text="Memo"
        size={14}
        color={context.theme.txtListItemSubscript}
        bold
      />
      <TextTitle text={memo} size={16} color={context.theme.txtListItem} bold />
    </View>
  );

  return <BaseItem mainComponent={memoComponent} listPressDisabled />;
}

const SendConfirmItem = {
  Amount: AmountItem,
  Address: AddressItem,
  Memo: MemoItem,
};

export default SendConfirmItem;
