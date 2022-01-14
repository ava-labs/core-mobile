import React from 'react';
import AvaListItem from 'components/AvaListItem';
import CarrotSVG from 'components/svg/CarrotSVG';
import AvaText from 'components/AvaText';
import useInAppBrowser from 'hooks/useInAppBrowser';

const LEGAL_URL = 'https://wallet.avax.network/legal';

const LegalItem = () => {
  const {openUrl} = useInAppBrowser();
  return (
    <>
      <AvaListItem.Base
        title={<AvaText.Heading3>Legal</AvaText.Heading3>}
        titleAlignment={'flex-start'}
        leftComponent={null}
        rightComponent={<CarrotSVG />}
        onPress={() => {
          openUrl(LEGAL_URL);
        }}
      />
    </>
  );
};

export default LegalItem;
