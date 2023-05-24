import AvaListItem from 'components/AvaListItem'
import Avatar from 'components/Avatar'
import AvaText from 'components/AvaText'
import React from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import TokenAddress from 'components/TokenAddress'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import MarketMovement from 'screens/watchlist/components/MarketMovement'
import type { ComponentStory, Meta } from '@storybook/react-native'

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: 'gray'
  }
})

const BaseDemo = () => {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      style={{ flex: 1, width: '100%' }}>
      <>
        <AvaListItem.Base
          title={'Anna Savranska'}
          leftComponent={<Avatar.Custom name={'Anna Savranska'} />}
          rightComponent={
            <TokenAddress
              address={'0x7d269823f20316c3602681f83b7a581828e78717'}
            />
          }
          rightComponentVerticalAlignment={'center'}
          embedInCard
        />
        <Space y={8} />
        <AvaListItem.Base
          title={'embedInCard = false'}
          rightComponent={
            <TokenAddress
              address={'0x7d269823f20316c3602681f83b7a581828e78717'}
            />
          }
          rightComponentVerticalAlignment={'center'}
        />
        <Space y={8} />
        <AvaListItem.Base
          title={'Network'}
          rightComponent={
            <AvaText.Body2 textStyle={{ marginRight: 8 }}>
              Mainnet
            </AvaText.Body2>
          }
          rightComponentVerticalAlignment={'center'}
          showNavigationArrow
          embedInCard
        />
        <Space y={8} />
        <AvaListItem.Base
          title={'Anna Savranska'}
          leftComponent={<Avatar.Custom name={'Anna Savranska'} />}
          rightComponent={
            <TokenAddress
              address={'0x7d269823f20316c3602681f83b7a581828e78717'}
            />
          }
          rightComponentVerticalAlignment={'center'}
          embedInCard
        />
        <Space y={8} />
        <AvaListItem.Base
          title={
            <AvaText.Heading1>United States Dollar (USD)</AvaText.Heading1>
          }
          titleAlignment={'flex-start'}
          background={'orange'}
        />
        <Space y={8} />
        <AvaListItem.Base
          title={'Account 1'}
          subtitle={<AvaText.TextLink>Edit</AvaText.TextLink>}
          rightComponent={
            <View style={{ alignItems: 'flex-end' }}>
              <TokenAddress
                address={'0x7d269823f20316c3602681f83b7a581828e78717'}
              />
              <Space y={4} />
              <AvaText.Body2>$4,093.02</AvaText.Body2>
            </View>
          }
          rightComponentVerticalAlignment={'center'}
          embedInCard
        />
        <Space y={8} />
        <AvaListItem.Base
          title={'AVAX'}
          leftComponent={<Avatar.Custom name={'Avalanche'} symbol={'AVAX'} />}
          rightComponent={
            <TokenAddress
              address={'0x7d269823f20316c3602681f83b7a581828e78717'}
            />
          }
          rightComponentVerticalAlignment={'center'}
          embedInCard
        />
        <Space y={8} />
        <AvaListItem.Base
          title={'AVAX'}
          subtitle={'Avalanche'}
          leftComponent={
            <Row style={{ alignItems: 'center' }}>
              <AvaText.Heading3>1</AvaText.Heading3>
              <Space x={8} />
              <Avatar.Custom name={'Avalanche'} symbol={'AVAX'} />
            </Row>
          }
          rightComponent={
            <Row
              style={{
                alignItems: 'center',
                justifyContent: 'flex-end',
                flex: 1
              }}>
              <View style={{ alignItems: 'flex-end' }}>
                <AvaText.Heading3>$94.02</AvaText.Heading3>
                <Space y={4} />
                <MarketMovement priceChange={2.32} percentChange={1.04} />
              </View>
            </Row>
          }
          rightComponentVerticalAlignment={'center'}
          embedInCard
        />
        <Space y={8} />
        <AvaListItem.Base
          title={<AvaText.Body2>From</AvaText.Body2>}
          titleAlignment={'flex-start'}
          subtitle={
            <Row style={{ justifyContent: 'space-between', marginEnd: 16 }}>
              <AvaText.Heading3>Nick Personal 1</AvaText.Heading3>
              <TokenAddress
                address={'0x7d269823f20316c3602681f83b7a581828e78717'}
              />
            </Row>
          }
        />
        <Space y={8} />
        <AvaListItem.Base
          title={'Anna Savranska'}
          leftComponent={<Avatar.Custom name={'Anna Savranska'} />}
          rightComponent={
            <TokenAddress
              address={'0x7d269823f20316c3602681f83b7a581828e78717'}
            />
          }
          rightComponentVerticalAlignment={'center'}
          embedInCard
        />
        <Space y={8} />
        <AvaListItem.Base
          title={'Anna Savranska'}
          leftComponent={<Avatar.Custom name={'Anna Savranska'} />}
          rightComponent={
            <TokenAddress
              address={'0x7d269823f20316c3602681f83b7a581828e78717'}
            />
          }
          rightComponentVerticalAlignment={'center'}
          embedInCard
        />
        <Space y={8} />
        <AvaListItem.Base
          title={'Anna Savranska'}
          leftComponent={<Avatar.Custom name={'Anna Savranska'} />}
          rightComponent={
            <TokenAddress
              address={'0x7d269823f20316c3602681f83b7a581828e78717'}
            />
          }
          rightComponentVerticalAlignment={'center'}
          embedInCard
        />
        <Space y={8} />
        <AvaListItem.Base
          title={'Anna Savranska'}
          leftComponent={<Avatar.Custom name={'Anna Savranska'} />}
          rightComponent={
            <TokenAddress
              address={'0x7d269823f20316c3602681f83b7a581828e78717'}
            />
          }
          rightComponentVerticalAlignment={'center'}
          embedInCard
        />
      </>
    </ScrollView>
  )
}

export default {
  title: 'AvaListItem'
} as Meta

export const BaseExamples = BaseDemo

export const CurrencyAmount: ComponentStory<
  typeof AvaListItem.CurrencyAmount
> = args => {
  return <AvaListItem.CurrencyAmount {...args} />
}

CurrencyAmount.args = {
  value: <AvaText.Heading1 ellipsizeMode={'tail'}>1500000000</AvaText.Heading1>,
  currency: <AvaText.Body2>USD</AvaText.Body2>,
  justifyContent: 'center'
}

CurrencyAmount.argTypes = {
  justifyContent: {
    options: ['flex-start', 'flex-end', 'center'],
    control: { type: 'radio' }
  },
  value: {
    table: {
      type: {
        summary: 'React.ReactNode'
      }
    },
    control: null
  }
}
