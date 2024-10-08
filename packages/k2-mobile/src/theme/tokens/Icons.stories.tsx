import React from 'react'

import { FlatList } from 'react-native'
import { SvgProps } from 'react-native-svg'
import Link from '../../utils/Link'
import { useTheme } from '../..'
import { Icons } from './Icons'

export default {
  title: 'Icons'
}

export const All = (): JSX.Element => {
  return (
    <Link
      title="Figma Source"
      url="https://www.figma.com/file/hDSl4OUgXorDAtqPZtCUhB/K2-Foundation?type=design&node-id=376%3A4252&mode=design&t=HOIixbVhKpxGrRwG-1"
    />
  )
}

const Template = ({
  icons,
  resourceURL
}: {
  icons: React.FC<SvgProps>[]
  resourceURL: string
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const renderItem = ({ item }: { item: React.FC<SvgProps> }): JSX.Element => {
    const IconComponent = item

    return <IconComponent color={colors.$neutral50} />
  }

  return (
    <FlatList
      contentContainerStyle={{ padding: 16 }}
      data={icons}
      numColumns={12}
      renderItem={renderItem}
      ListHeaderComponent={
        <Link
          title="Figma Source"
          url={resourceURL}
          style={{ marginBottom: 20 }}
        />
      }
    />
  )
}

export const Navigation = (): JSX.Element =>
  Template({
    icons: [
      Icons.Navigation.ArrowBackIOSNew,
      Icons.Navigation.ArrowForwardIOS,
      Icons.Navigation.Cancel,
      Icons.Navigation.Check,
      Icons.Navigation.ExpandMore,
      Icons.Navigation.MoreHoriz,
      Icons.Navigation.Refresh
    ],
    resourceURL:
      'https://www.figma.com/file/hDSl4OUgXorDAtqPZtCUhB/K2-Foundation?type=design&node-id=378-5642&mode=design&t=HOIixbVhKpxGrRwG-4'
  })

export const Communication = (): JSX.Element =>
  Template({
    icons: [Icons.Communication.IconKey, Icons.Communication.IconQRCode],
    resourceURL:
      'https://www.figma.com/file/hDSl4OUgXorDAtqPZtCUhB/K2-Foundation?type=design&node-id=376-14634&mode=design&t=sWvS6Pnw2oR45PI0-4'
  })

export const Content = (): JSX.Element =>
  Template({
    icons: [
      Icons.Content.Add,
      Icons.Content.IconBackspace,
      Icons.Content.ContentCopy
    ],
    resourceURL:
      'https://www.figma.com/file/hDSl4OUgXorDAtqPZtCUhB/K2-Foundation?type=design&node-id=376-16360&mode=design&t=CmN8i9XpOWpJzqsg-4'
  })

export const Device = (): JSX.Element =>
  Template({
    icons: [Icons.Device.IconUSB],
    resourceURL:
      'https://www.figma.com/file/hDSl4OUgXorDAtqPZtCUhB/K2-Foundation?type=design&node-id=376-17725&mode=design&t=CmN8i9XpOWpJzqsg-4'
  })

export const Logos = (): JSX.Element =>
  Template({
    icons: [Icons.Logos.WalletConnect],
    resourceURL:
      'https://www.figma.com/file/hDSl4OUgXorDAtqPZtCUhB/K2-Foundation?type=design&node-id=4077-18641&mode=design&t=nUpymAzmHG0hgmLO-4'
  })
