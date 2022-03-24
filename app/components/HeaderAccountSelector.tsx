import React, {useEffect, useMemo, useState} from 'react';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaButton from 'components/AvaButton';
import {StyleSheet, View} from 'react-native';
import AvaText from 'components/AvaText';
import CarrotSVG from 'components/svg/CarrotSVG';
import {Account} from 'dto/Account';

export type Direction = 'up' | 'down';

export default function HeaderAccountSelector({
  onPressed,
  direction,
}: {
  onPressed?: () => void;
  direction?: Direction;
}) {
  const {accounts} = useApplicationContext().repo.accountsRepo;
  const [activeAccount, setActiveAccount] = useState<Account | undefined>();
  const theme = useApplicationContext().theme;
  const rotation = useMemo(
    () => (direction === 'up' ? '-90deg' : '90deg'),
    [direction],
  );

  useEffect(() => {
    const activeAcc = [...accounts.values()].find(acc => acc.active);
    setActiveAccount(activeAcc);
  }, [accounts]);

  return (
    <AvaButton.Base onPress={onPressed}>
      <View style={[styles.accountTitleContainer]}>
        <AvaText.Heading3
          ellipsizeMode={'middle'}
          textStyle={{marginRight: 16}}>
          {activeAccount?.title}
        </AvaText.Heading3>
        <View style={{transform: [{rotate: rotation}]}}>
          <CarrotSVG color={theme.colorText1} />
        </View>
      </View>
    </AvaButton.Base>
  );
}

const styles = StyleSheet.create({
  accountTitleContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
});
