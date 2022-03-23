import React, {FC, ReactNode} from 'react';
import {Image, View} from 'react-native';
import AvaText from './AvaText';
import PersonageWithLantern from 'components/images/PersonageWithLantern';
import {Space} from 'components/Space';
import AvaButton from 'components/AvaButton';

interface BaseProps {
  image?: string | ReactNode;
  title?: string | ReactNode;
  message?: string | ReactNode;
  additionalComponent?: ReactNode;
}

const ZeroStateBase: FC<BaseProps> = ({
  image,
  title,
  message,
  additionalComponent,
}) => {
  function getImage() {
    if (!image) {
      return null;
    }

    if (typeof image === 'string') {
      return <Image source={{uri: image}} />;
    }
    return <View>{image}</View>;
  }

  function getTitle() {
    if (typeof title === 'string') {
      return (
        <AvaText.Heading2 textStyle={{marginTop: 16}}>{title}</AvaText.Heading2>
      );
    }
    return <View style={{marginTop: 16}}>{title}</View>;
  }

  function getMessage() {
    if (typeof message === 'string') {
      return <AvaText.Body2>{message}</AvaText.Body2>;
    }
    return <View>{message}</View>;
  }

  return (
    <View
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
      }}>
      {getImage() && (
        <>
          <Space y={52} />
          {getImage()}
          <Space y={52} />
        </>
      )}
      {getTitle()}
      <Space y={16} />
      {getMessage()}
      {additionalComponent && (
        <>
          <Space y={24} />
          {additionalComponent}
        </>
      )}
    </View>
  );
};

type ZeroStateSendErrorProps = Pick<
  BaseProps,
  'additionalComponent' | 'message'
>;

function ZeroStateSendError({
  additionalComponent,
  message,
}: ZeroStateSendErrorProps) {
  const title = 'Oops, something went wrong';
  return (
    <ZeroStateBase
      title={title}
      message={message ?? 'An unknown error as occurred.'}
      additionalComponent={additionalComponent}
    />
  );
}

function ZeroStatePortfolio() {
  const title = 'Your wallet is empty';
  const message = 'Add tokens using the receive button above';

  return <ZeroStateBase title={title} message={message} />;
}

function ZeroStateCollectibles() {
  const title = 'No Collectibles';
  const message = 'You don’t have any collectibles yet.';

  return (
    <ZeroStateBase
      title={title}
      message={message}
      additionalComponent={
        <AvaButton.PrimaryMedium>Explore NFTs</AvaButton.PrimaryMedium>
      }
    />
  );
}

function ZeroStateNoResultsTextual() {
  const title = 'No results found';
  const message =
    'There are no tokens that match your search.\nPlease try again.';

  return <ZeroStateBase title={title} message={message} />;
}

function ZeroStateNoRecentAccounts() {
  const title = 'No recent recipients';
  const message = 'Enter the address in the field above.';

  return <ZeroStateBase title={title} message={message} />;
}

function ZeroStateEmptyAddressBook({
  onGoToAddressBook,
}: {
  onGoToAddressBook: () => void;
}) {
  const title = 'No addresses';
  const message = 'You can add addresses in Address Book';

  return (
    <ZeroStateBase
      title={title}
      message={message}
      additionalComponent={
        <AvaButton.PrimaryMedium onPress={onGoToAddressBook}>
          Go to Address Book
        </AvaButton.PrimaryMedium>
      }
    />
  );
}

type NoResultsProps = Pick<BaseProps, 'message'>;

function ZeroStateNoResults({message}: NoResultsProps) {
  return (
    <ZeroStateBase
      message={message ?? 'No results found'}
      image={<PersonageWithLantern />}
    />
  );
}

function ZeroStateComingSoon() {
  return (
    <ZeroStateBase title={'Coming soon!'} image={<PersonageWithLantern />} />
  );
}

const ZeroState = {
  Portfolio: ZeroStatePortfolio,
  Collectibles: ZeroStateCollectibles,
  NoResultsGraphical: ZeroStateNoResults,
  NoResultsTextual: ZeroStateNoResultsTextual,
  NoRecentAccounts: ZeroStateNoRecentAccounts,
  EmptyAddressBook: ZeroStateEmptyAddressBook,
  ComingSoon: ZeroStateComingSoon,
  SendError: ZeroStateSendError,
};

export default ZeroState;
