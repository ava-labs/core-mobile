import React, {FC} from 'react';
import AvaListItem from 'components/AvaListItem';
import CheckmarkSVG from 'components/svg/CheckmarkSVG';
import {useApplicationContext} from 'contexts/ApplicationContext';

type Props = {
  name: string;
  selected: boolean;
  onPress: () => void;
};

const CurrencyListItem: FC<Props> = ({name, selected, onPress}) => {
  const theme = useApplicationContext().theme;
  return (
    <>
      <AvaListItem.Base
        title={name}
        rightComponent={selected && <CheckmarkSVG />}
        background={selected ? theme.listItemBg : theme.background}
        onPress={onPress}
      />
    </>
  );
};

export default CurrencyListItem;
