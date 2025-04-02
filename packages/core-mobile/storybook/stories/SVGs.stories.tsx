import React, { FC, PropsWithChildren } from 'react'
import StakeLogoBigSVG from 'components/svg/StakeLogoBigSVG'
import StakeLogoSmallSVG from 'components/svg/StakeLogoSmallSVG'
import ClockSVG from 'components/svg/ClockSVG'
import { ScrollView, View } from '@avalabs/k2-mobile'
import AccountSVG from 'components/svg/AccountSVG'
import AddressBookSVG from 'components/svg/AddressBookSVG'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import AddSVG from 'components/svg/AddSVG'
import AnalyticsSVG from 'components/svg/AnalyticsSVG'
import ArrowSVG from 'components/svg/ArrowSVG'
import AvaLogoSVG from 'components/svg/AvaLogoSVG'
import AvaToken from 'components/svg/AvaToken'
import BitcoinSVG from 'components/svg/BitcoinSVG'
import BridgeSVG from 'components/svg/BridgeSVG'
import BuySVG from 'components/svg/BuySVG'
import BridgeToggleIcon from 'assets/icons/BridgeToggleIcon.svg'
import Calendar2SVG from 'components/svg/Calendar2SVG'
import CalendarSVG from 'components/svg/CalendarSVG'
import CandleChartSVG from 'components/svg/CandleChartSVG'
import CarrotSVG from 'components/svg/CarrotSVG'
import CheckBoxEmptySVG from 'components/svg/CheckBoxEmptySVG'
import CheckBoxSVG from 'components/svg/CheckBoxSVG'
import CheckmarkSVG from 'components/svg/CheckmarkSVG'
import CircularPlusSVG from 'components/svg/CircularPlusSVG'
import CircularText from 'components/svg/CircularText'
import ClearInputSVG from 'components/svg/ClearInputSVG'
import ClearSVG from 'components/svg/ClearSVG'
import CopySVG from 'components/svg/CopySVG'
import CreateNewWalletPlusSVG from 'components/svg/CreateNewWalletPlusSVG'
import DarkModeSVG from 'components/svg/DarkModeSVG'
import DeleteSVG from 'components/svg/DeleteSVG'
import DotSVG from 'components/svg/DotSVG'
import DragHandleSVG from 'components/svg/DragHandleSVG'
import EarnSVG from 'components/svg/EarnSVG'
import EditSVG from 'components/svg/EditSVG'
import EllipsisSVG from 'components/svg/EllipsisSVG'
import EthereumSvg from 'components/svg/Ethereum'
import Globe2SVG from 'components/svg/Globe2SVG'
import GlobeSVG from 'components/svg/GlobeSVG'
import GraphSVG from 'components/svg/GraphSVG'
import GridSVG from 'components/svg/GridSVG'
import HistorySVG from 'components/svg/HistorySVG'
import HomeSVG from 'components/svg/HomeSVG'
import InfoSVG from 'components/svg/InfoSVG'
import LightModeSVG from 'components/svg/LightModeSVG'
import LinearGradientSVG from 'components/svg/LinearGradientSVG'
import LineChartSVG from 'components/svg/LineChartSVG'
import LinkSVG from 'components/svg/LinkSVG'
import ListSVG from 'components/svg/ListSVG'
import MenuSVG from 'components/svg/MenuSVG'
import PersonSVG from 'components/svg/PersonSVG'
import QRCodeSVG from 'components/svg/QRCodeSVG'
import QRScanSVG from 'components/svg/QRScanSVG'
import QRSVG from 'components/svg/QRSVG'
import QuestionSVG from 'components/svg/QuestionSVG'
import ReloadSVG from 'components/svg/ReloadSVG'
import SearchSVG from 'components/svg/SearchSVG'
import SettingsCogSVG from 'components/svg/SettingsCogSVG'
import ShareSVG from 'components/svg/ShareSVG'
import StarSVG from 'components/svg/StarSVG'
import SwapNarrowSVG from 'components/svg/SwapNarrowSVG'
import SwapSVG from 'components/svg/SwapSVG'
import SwitchesSVG from 'components/svg/SwitchesSVG'
import SwitchSVG from 'components/svg/SwitchSVG'
import TagSVG from 'components/svg/TagSVG'
import TrashSVG from 'components/svg/TrashSVG'
import WalletConnectSVG from 'components/svg/WalletConnectSVG'
import WatchListSVG from 'components/svg/WatchlistSVG'
import FingerprintSVG from 'components/svg/FingerprintSVG'
import FaceIdSVG from 'components/svg/FaceIdSVG'

export default {
  title: 'SVGs'
}

const IconContainer: FC<
  {
    name: string
    height?: string | number
    width?: string | number
  } & PropsWithChildren
> = ({ children, name, height, width }) => {
  return (
    <View
      sx={{
        margin: 8,
        alignItems: 'center',
        justifyContent: 'flex-end',
        height,
        width
      }}>
      {children}
      <Space y={8} />
      <AvaText.Body1>{name}</AvaText.Body1>
    </View>
  )
}

export const SVGList = (): JSX.Element => {
  return (
    <ScrollView
      contentContainerStyle={{
        margin: 16,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around'
      }}>
      <IconContainer children={<FingerprintSVG />} name="Fingerprint" />
      <IconContainer children={<FaceIdSVG />} name="Face id" />
      <IconContainer children={<AvaLogoSVG />} name="Ava Logo" />
      <IconContainer children={<StakeLogoBigSVG />} name="Stake Logo" />
      <IconContainer children={<StakeLogoSmallSVG />} name="Stake Logo" />
      <IconContainer children={<AccountSVG />} name="Account" />
      <IconContainer children={<AddressBookSVG />} name="Address Book" />
      <IconContainer children={<AddSVG />} name="Add" />
      <IconContainer children={<AnalyticsSVG />} name="Analytics" />
      <IconContainer children={<ArrowSVG />} name="Arrow" />
      <IconContainer children={<AvaToken />} name="Ava Token" />
      <IconContainer children={<BitcoinSVG />} name="Bitcoin" />
      <IconContainer children={<BridgeSVG color="white" />} name="Bridge" />
      <IconContainer
        children={<BridgeToggleIcon color="white" />}
        name="Bridge Toggle"
      />
      <IconContainer children={<BuySVG />} name="Buy" />
      <IconContainer children={<Calendar2SVG />} name="Calendar2" />
      <IconContainer
        children={<CalendarSVG selected={true} />}
        name="Calendar"
      />
      <IconContainer
        children={<CandleChartSVG color="white" />}
        name="Candle Chart"
      />
      <IconContainer children={<CarrotSVG />} name="Carrot" />
      <IconContainer children={<CheckBoxEmptySVG />} name="Checkbox Empty" />
      <IconContainer children={<CheckBoxSVG />} name="Checkbox" />
      <IconContainer children={<CheckmarkSVG />} name="Checkmark" />
      <IconContainer children={<CircularPlusSVG />} name="Circular Plus" />
      <IconContainer
        children={<CircularText text={'Circular Text'} size={32} />}
        name="Circular Text"
      />
      <IconContainer
        children={<ClearInputSVG color={'white'} size={32} />}
        name="Clear Input"
      />
      <IconContainer
        children={<ClearSVG color={'black'} backgroundColor={'white'} />}
        name="Clear"
      />
      <IconContainer children={<ClockSVG />} name="Clock" />
      <IconContainer children={<CopySVG />} name="Copy" />
      <IconContainer
        children={<CreateNewWalletPlusSVG />}
        name="Create New Wallet Plus"
      />
      <IconContainer children={<DarkModeSVG />} name="Dark Mode" />
      <IconContainer children={<DeleteSVG />} name="Delete" />
      <IconContainer children={<DotSVG borderColor={'white'} />} name="Dot" />
      <IconContainer children={<DragHandleSVG />} name="Drag Handle" />
      <IconContainer
        children={<EarnSVG selected={true} size={32} />}
        name="Earn"
      />
      <IconContainer children={<EditSVG />} name="Edit" />
      <IconContainer children={<EllipsisSVG />} name="Ellipsis" />
      <IconContainer children={<EthereumSvg />} name="Ethereum" />
      <IconContainer children={<Globe2SVG />} name="Globe2" />
      <IconContainer children={<GlobeSVG />} name="Globe" />
      <IconContainer children={<GraphSVG />} name="Graph" />
      <IconContainer children={<GridSVG />} name="Grid" />
      <IconContainer
        children={<HistorySVG selected={true} size={32} />}
        name="History"
      />
      <IconContainer children={<HomeSVG selected={true} />} name="Home" />
      <IconContainer
        children={<InfoSVG color={'white'} size={32} />}
        name="Info"
      />
      <IconContainer children={<LightModeSVG />} name="Light Mode" />
      <IconContainer
        children={<LineChartSVG color="white" />}
        name="Line Chart"
      />
      <IconContainer children={<LinkSVG />} name="Link" />
      <IconContainer children={<ListSVG />} name="List" />
      <IconContainer children={<MenuSVG />} name="Menu" />
      <IconContainer children={<PersonSVG />} name="Person" />
      <IconContainer children={<QRCodeSVG />} name="QR Code" />
      <IconContainer children={<QRScanSVG />} name="QR Scan" />
      <IconContainer children={<QRSVG />} name="QR" />
      <IconContainer children={<QuestionSVG color="white" />} name="Question" />
      <IconContainer children={<ReloadSVG />} name="Reload" />
      <IconContainer
        children={<SearchSVG circleColor="white" />}
        name="Search"
      />
      <IconContainer children={<SettingsCogSVG />} name="Settings Cog" />
      <IconContainer children={<ShareSVG />} name="Share" />
      <IconContainer children={<StarSVG />} name="Star" />
      <IconContainer children={<SwapNarrowSVG />} name="Swap Narrow" />
      <IconContainer children={<SwapSVG />} name="Swap" />
      <IconContainer children={<SwitchesSVG />} name="Switches" />
      <IconContainer children={<SwitchSVG />} name="Switch" />
      <IconContainer children={<TagSVG />} name="Tag" />
      <IconContainer children={<TrashSVG color="white" />} name="Trash" />
      <IconContainer
        children={<WalletConnectSVG color={'white'} />}
        name="Wallet Connect"
      />
      <IconContainer
        children={<WatchListSVG selected={true} />}
        name="Watch List"
      />
      <View style={{ marginTop: 32 }}>
        <IconContainer
          height={64}
          width={300}
          children={
            <LinearGradientSVG
              colorFrom={'green'}
              colorTo={'red'}
              orientation={'horizontal'}
            />
          }
          name="Linear Gradient"
        />
      </View>
    </ScrollView>
  )
}
