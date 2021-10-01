import React, {FC} from 'react';
import AvaListItem from 'components/AvaListItem';
import CheckmarkSVG from 'components/svg/CheckmarkSVG';

type Props = {
  name: string;
  selected: boolean;
  onPress: () => void;
};

const CurrencyListItem: FC<Props> = ({name, selected, onPress}) => {
  return (
    <>
      <AvaListItem.Base
        title={name}
        rightComponent={selected && <CheckmarkSVG />}
        onPress={onPress}
      />
    </>
  );
};

export default CurrencyListItem;
