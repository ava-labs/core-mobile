import {Space} from 'components/Space';
import AvaText from 'components/AvaText';
import {Row} from 'components/Row';
import Separator from 'components/Separator';
import React from 'react';

export default function SendRow({
  label,
  title,
  address,
}: {
  label: string;
  title: string;
  address: string;
}) {
  return (
    <>
      <Space y={8} />
      <AvaText.Body2>{label}</AvaText.Body2>
      <Row style={{justifyContent: 'space-between'}}>
        <AvaText.Heading3>{title}</AvaText.Heading3>
        <AvaText.Body1 ellipsizeMode={'middle'} textStyle={{width: 152}}>
          {address}
        </AvaText.Body1>
      </Row>
      <Space y={4} />
      <Separator />
    </>
  );
}
