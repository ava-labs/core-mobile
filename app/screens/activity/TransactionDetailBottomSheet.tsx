import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
import {InteractionManager, Pressable, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import AvaText from 'components/AvaText';
import AvaLogoSVG from 'components/svg/AvaLogoSVG';
import AvaListItem from 'components/AvaListItem';
import ArrowSVG from 'components/svg/ArrowSVG';
import LinkSVG from 'components/svg/LinkSVG';
import ButtonAvaTextual from 'components/ButtonAvaTextual';

function AccountBottomSheet() {
  const {goBack} = useNavigation();
  const bottomSheetModalRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['0%', '55%'], []);

  useEffect(() => {
    // intentionally setting delay so animation is visible.
    setTimeout(() => {
      bottomSheetModalRef?.current?.snapTo(1);
    }, 100);
  }, []);

  const handleClose = useCallback(() => {
    bottomSheetModalRef?.current?.close();
    InteractionManager.runAfterInteractions(() => goBack());
  }, []);

  const handleChange = useCallback(index => {
    // eslint-disable-next-line no-console
    console.log('handleSheetChange', index);
    index === 0 && handleClose();
  }, []);

  const tokenLogo = (
    <View
      style={[
        styles.tokenLogo,
        {
          backgroundColor: '#F1595A33',
          justifyContent: 'center',
          alignItems: 'center',
        },
      ]}>
      <ArrowSVG color={'#E6787B'} />
    </View>
  );

  return (
    <>
      <Pressable
        style={[
          StyleSheet.absoluteFill,
          {backgroundColor: 'rgba(0, 0, 0, 0.5)'},
        ]}
        onPress={goBack}
      />
      <BottomSheet
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        onChange={handleChange}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'white',
            justifyContent: 'center',
            padding: 16,
          }}>
          <View style={styles.logoContainer}>
            <AvaText.Heading1>Transaction Details</AvaText.Heading1>
            <AvaText.Body2 textStyle={{paddingTop: 8, paddingBottom: 32}}>
              Sep 10, 2021 09:00 am - Bal: $89.700,01
            </AvaText.Body2>

            <AvaLogoSVG size={32} />

            <AvaText.Heading1 textStyle={{paddingTop: 16}}>
              -10.02 LINK
            </AvaText.Heading1>
            <AvaText.Body2 textStyle={{paddingTop: 8, paddingBottom: 32}}>
              $434.59 USD - Fee: 0.01 AVAX
            </AvaText.Body2>
          </View>
          <AvaListItem.Custom
            leftComponent={tokenLogo}
            label={'From'}
            title={'Xfuji1hul6q0w383863v6kejul2psaeumcwee5fzzk2e'}
          />
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <LinkSVG />
            <ButtonAvaTextual text="View on Explorer" onPress={() => {}} />
          </View>
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenLogo: {
    paddingHorizontal: 16,
    width: 32,
    height: 32,
    borderRadius: 20,
    overflow: 'hidden',
  },
});

export default AccountBottomSheet;
