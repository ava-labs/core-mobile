import React, {FC, useContext} from 'react';
import {View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import AvaListItem from 'components/AvaListItem';
import {Row} from 'components/Row';
import AvaText from 'components/AvaText';
import OvalTagBg from 'components/OvalTagBg';
import {displaySeconds} from 'utils/Utils';
import CheckmarkSVG from 'components/svg/CheckmarkSVG';
import ConfirmationTracker from 'screens/bridge/ConfirmationTracker';
import {TrackerViewProps} from '@avalabs/bridge-sdk';

interface Props {
  txProps: TrackerViewProps;
}

const BridgeConfirmations: FC<Props> = txProps => {
  const theme = useContext(ApplicationContext).theme;

  return (
    <View style={{backgroundColor: theme.bgApp}}>
      <AvaListItem.Base
        title={'Confirmations'}
        rightComponent={
          <Row style={{alignItems: 'center'}}>
            <AvaText.Heading3 textStyle={{marginEnd: 8}}>
              {txProps.confirmationCount > // to avoid showing 16/15 since confirmations keep going up
              txProps.requiredConfirmationCount
                ? txProps.requiredConfirmationCount
                : txProps.confirmationCount}
              /{txProps.requiredConfirmationCount}
            </AvaText.Heading3>
            <OvalTagBg
              color={txProps.complete ? theme.colorSuccess : theme.colorBg3}>
              <AvaText.ButtonSmall>
                {displaySeconds(txProps.sourceSeconds)}
                {txProps.complete && (
                  <>
                    {' '}
                    <CheckmarkSVG color={theme.white} size={10} />
                  </>
                )}
              </AvaText.ButtonSmall>
            </OvalTagBg>
          </Row>
        }
      />
      <ConfirmationTracker
        started={true}
        requiredCount={txProps.requiredConfirmationCount}
        currentCount={
          txProps.confirmationCount > txProps.requiredConfirmationCount
            ? txProps.requiredConfirmationCount
            : txProps.confirmationCount
        }
      />
    </View>
  );
};

export default BridgeConfirmations;
