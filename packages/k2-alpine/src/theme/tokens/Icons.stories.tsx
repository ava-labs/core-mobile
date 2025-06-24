import React from 'react'
import Link from '../../utils/Link'
import { useTheme } from '../../hooks'
import { Icons } from './Icons'
import { Template } from './Template'

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

export const Action = (): JSX.Element =>
  Template({
    icons: [
      Icons.Action.Info,
      Icons.Action.CheckCircleOutline,
      Icons.Action.Clear,
      Icons.Action.VisibilityOff
    ],
    resourceURL:
      'https://www.figma.com/design/hDSl4OUgXorDAtqPZtCUhB/K2-Foundation?node-id=343-3506&t=aSE6qCYReaOZSaNQ-0'
  })

export const Alert = (): JSX.Element => {
  return Template({
    icons: [
      Icons.Alert.Error,
      Icons.Alert.ErrorOutline,
      Icons.Alert.AlertCircle
    ],
    resourceURL:
      'https://www.figma.com/design/hDSl4OUgXorDAtqPZtCUhB/K2-Foundation?node-id=376-11711&t=aSE6qCYReaOZSaNQ-0'
  })
}

export const Device = (): JSX.Element =>
  Template({
    icons: [Icons.Device.GPPMaybe, Icons.Device.Encrypted],
    resourceURL:
      'https://www.figma.com/design/hDSl4OUgXorDAtqPZtCUhB/K2-Foundation?node-id=376-17725&t=aSE6qCYReaOZSaNQ-0'
  })

export const Social = (): JSX.Element =>
  Template({
    icons: [
      Icons.Social.Notifications,
      Icons.Social.RemoveModerator,
      Icons.Social.ShareIOS
    ],
    resourceURL:
      'https://www.figma.com/design/hDSl4OUgXorDAtqPZtCUhB/K2-Foundation?node-id=378-6086&t=aSE6qCYReaOZSaNQ-0'
  })

export const Notification = (): JSX.Element =>
  Template({
    icons: [Icons.Notification.Sync],
    resourceURL:
      'https://www.figma.com/design/hDSl4OUgXorDAtqPZtCUhB/K2-Foundation?node-id=437-6716&t=aSE6qCYReaOZSaNQ-0'
  })

export const Communication = (): JSX.Element =>
  Template({
    icons: [Icons.Communication.QRCode2],
    resourceURL:
      'https://www.figma.com/design/hDSl4OUgXorDAtqPZtCUhB/K2-Foundation?node-id=376-14634&t=aSE6qCYReaOZSaNQ-0'
  })

export const Toggle = (): JSX.Element =>
  Template({
    icons: [Icons.Toggle.StarOutline, Icons.Toggle.StarFilled],
    resourceURL:
      'https://www.figma.com/design/hDSl4OUgXorDAtqPZtCUhB/K2-Foundation?node-id=380-5594&t=aSE6qCYReaOZSaNQ-0'
  })

export const Content = (): JSX.Element =>
  Template({
    icons: [Icons.Content.Add],
    resourceURL:
      'https://www.figma.com/design/hDSl4OUgXorDAtqPZtCUhB/K2-Foundation?node-id=376-16360&t=aSE6qCYReaOZSaNQ-0'
  })

export const Navigation = (): JSX.Element =>
  Template({
    icons: [
      Icons.Navigation.Check,
      Icons.Navigation.ExpandMore,
      Icons.Navigation.ArrowForwardIOS,
      Icons.Navigation.ChevronRight,
      Icons.Navigation.ChevronRightV2
    ],
    resourceURL:
      'https://www.figma.com/file/hDSl4OUgXorDAtqPZtCUhB/K2-Foundation?type=design&node-id=378-5642&mode=design&t=HOIixbVhKpxGrRwG-4'
  })

export const Custom = (): JSX.Element =>
  Template({
    icons: [
      Icons.Custom.ArrowDown,
      Icons.Custom.BackArrowCustom,
      Icons.Custom.Error,
      Icons.Custom.FaceID,
      Icons.Custom.TouchID,
      Icons.Custom.QRCodeScanner,
      Icons.Custom.Pin,
      Icons.Custom.Psychiatry,
      Icons.Custom.Send,
      Icons.Custom.SwitchRight,
      Icons.Custom.TrendingArrowDown,
      Icons.Custom.TrendingArrowUp,
      Icons.Custom.ArrowDownHandleBar,
      Icons.Custom.Compass,
      Icons.Custom.Contactless,
      Icons.Custom.Connect,
      Icons.Custom.CameraFrame,
      Icons.Custom.KidStar,
      Icons.Custom.RedExclamation,
      Icons.Custom.Outbound,
      Icons.Custom.SearchCustom,
      Icons.Custom.Search,
      Icons.Custom.SignPost,
      Icons.Custom.Signature,
      Icons.Custom.AvalabsTrademark,
      Icons.Custom.TxTypeAdd,
      Icons.Custom.AdvanceTime,
      Icons.Custom.Airdrop,
      Icons.Custom.WaterDrop,
      Icons.Custom.WaterDropFilled,
      Icons.Custom.CheckSmall,
      Icons.Custom.Bridge,
      Icons.Custom.ContractCall,
      Icons.Custom.Receive,
      Icons.Custom.TxTypeSend,
      Icons.Custom.Subnet,
      Icons.Custom.Compare,
      Icons.Custom.Unknown,
      Icons.Custom.Unwrap,
      Icons.Custom.AddCircle,
      Icons.Custom.DoNotDisturbOn
    ],
    itemPadding: 16,
    numColumns: 2,
    resourceURL:
      'https://www.figma.com/file/hDSl4OUgXorDAtqPZtCUhB/K2-Foundation?type=design&node-id=378-5642&mode=design&t=HOIixbVhKpxGrRwG-4'
  })

export const File = (): JSX.Element =>
  Template({
    icons: [Icons.File.Download],
    resourceURL:
      'https://www.figma.com/design/hDSl4OUgXorDAtqPZtCUhB/K2-Foundation?node-id=376-23667&t=qM1otSwKcHtbI8Mp-0'
  })

export const RecoveryMethods = (): JSX.Element =>
  Template({
    icons: [
      Icons.RecoveryMethod.Authenticator,
      Icons.RecoveryMethod.Copy,
      Icons.RecoveryMethod.Passkey,
      Icons.RecoveryMethod.QrCode,
      Icons.RecoveryMethod.Yubikey
    ],
    itemPadding: 8,
    resourceURL: ''
  })

export const Logos = (): JSX.Element =>
  Template({
    icons: [
      Icons.Logos.Apple,
      Icons.Logos.AuthenticatorApp,
      Icons.Logos.Google,
      Icons.Logos.GoogleAuthenticator,
      Icons.Logos.MicrosoftAuthenticator
    ],
    itemPadding: 8,
    resourceURL:
      'https://www.figma.com/design/hDSl4OUgXorDAtqPZtCUhB/K2-Foundation?node-id=1865-5334&t=aSE6qCYReaOZSaNQ-0'
  })

export const CurrencyFlags = (): JSX.Element =>
  Template({
    icons: [
      Icons.Currencies.AED,
      Icons.Currencies.ARS,
      Icons.Currencies.AUD,
      Icons.Currencies.BDT,
      Icons.Currencies.BGN,
      Icons.Currencies.BRL,
      Icons.Currencies.CAD,
      Icons.Currencies.BGN,
      Icons.Currencies.CHF,
      Icons.Currencies.CNY,
      Icons.Currencies.COP,
      Icons.Currencies.CZK,
      Icons.Currencies.EGP,
      Icons.Currencies.EUR,
      Icons.Currencies.GBP,
      Icons.Currencies.HKD,
      Icons.Currencies.HUF,
      Icons.Currencies.IDR,
      Icons.Currencies.IDR1,
      Icons.Currencies.ILS,
      Icons.Currencies.INR,
      Icons.Currencies.IRR,
      Icons.Currencies.JPY,
      Icons.Currencies.KRW,
      Icons.Currencies.MAD,
      Icons.Currencies.MYR,
      Icons.Currencies.MXN,
      Icons.Currencies.NGN,
      Icons.Currencies.NOK,
      Icons.Currencies.NZD,
      Icons.Currencies.PHP,
      Icons.Currencies.PKR,
      Icons.Currencies.PLN,
      Icons.Currencies.RON,
      Icons.Currencies.RUB,
      Icons.Currencies.SAR,
      Icons.Currencies.SEK,
      Icons.Currencies.SGD,
      Icons.Currencies.THB,
      Icons.Currencies.TRY,
      Icons.Currencies.TWD,
      Icons.Currencies.USD,
      Icons.Currencies.VND,
      Icons.Currencies.ZAR
    ],
    numColumns: 2,
    itemPadding: 24,
    resourceURL:
      'https://www.figma.com/design/aj9mmgDMaaxZXkuIRKLhIn/Core-Mobile-Redesign-2025?node-id=257-7379&t=IFcOba3yyNJLDjXt-0'
  })

export const TokenLogos = (): JSX.Element => {
  const { theme } = useTheme()

  return Template({
    icons: [
      Icons.TokenLogos.AAVE,
      Icons.TokenLogos.ADA,
      Icons.TokenLogos.APT,
      Icons.TokenLogos.ARB,
      Icons.TokenLogos.ATOM,
      Icons.TokenLogos.AVAX,
      Icons.TokenLogos.WAVAX,
      Icons.TokenLogos.BCH,
      Icons.TokenLogos.BNB,
      Icons.TokenLogos.BTC,
      Icons.TokenLogos.DAI,
      Icons.TokenLogos.DOGE,
      Icons.TokenLogos.DOT,
      Icons.TokenLogos.ETH,
      Icons.TokenLogos.ETH1,
      Icons.TokenLogos.FIL,
      Icons.TokenLogos.FLOW,
      Icons.TokenLogos.GRT,
      Icons.TokenLogos.HBAR,
      Icons.TokenLogos.ICP,
      Icons.TokenLogos.IMX,
      Icons.TokenLogos.LDO,
      Icons.TokenLogos.LEO,
      Icons.TokenLogos.LINK,
      Icons.TokenLogos.MATIC,
      Icons.TokenLogos.NEAR,
      Icons.TokenLogos.OKB,
      Icons.TokenLogos.ONDO,
      Icons.TokenLogos.QNT,
      Icons.TokenLogos.SHIB,
      Icons.TokenLogos.SOL,
      Icons.TokenLogos.STX,
      Icons.TokenLogos.SUI,
      Icons.TokenLogos.TON,
      Icons.TokenLogos.TRX,
      Icons.TokenLogos.UNI,
      Icons.TokenLogos.USDC,
      Icons.TokenLogos.USDT,
      Icons.TokenLogos.VET,
      Icons.TokenLogos.XLM,
      Icons.TokenLogos.XRP,
      Icons.TokenLogos.SAVAX,
      theme.isDark
        ? Icons.TokenLogos.AVAX_P_DARK
        : Icons.TokenLogos.AVAX_P_LIGHT,
      theme.isDark
        ? Icons.TokenLogos.AVAX_X_DARK
        : Icons.TokenLogos.AVAX_X_LIGHT
    ],
    itemPadding: 16,
    numColumns: 2,
    resourceURL:
      'https://www.figma.com/design/aj9mmgDMaaxZXkuIRKLhIn/Core-Mobile-Redesign-2025?node-id=257-7376&t=IFcOba3yyNJLDjXt-0'
  })
}
