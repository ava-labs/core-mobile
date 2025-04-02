import { useTheme } from '../../hooks'
import { Logos } from './Logos'
import { Template } from './Template'

export default {
  title: 'Logos'
}

export const AppIcons = (): JSX.Element => {
  return Template({
    icons: [
      Logos.AppIcons.Core,
      Logos.AppIcons.CoreAppIconDark,
      Logos.AppIcons.CoreAppIconLight,
      Logos.AppIcons.CoreAppIconDev
    ],
    numColumns: 1,
    itemPadding: 16,
    resourceURL:
      'https://www.figma.com/design/aj9mmgDMaaxZXkuIRKLhIn/Core-Mobile-Redesign-2025?node-id=2112-22374&t=qsZNsJxvQmOm4GIg-0'
  })
}

export const PartnerLogos = (): JSX.Element => {
  const { theme } = useTheme()

  return Template({
    icons: [
      Logos.PartnerLogos.CoinbasePay,
      Logos.PartnerLogos.Halliday,
      Logos.PartnerLogos.Moonpay,
      Logos.PartnerLogos.Stripe,
      theme.isDark
        ? Logos.PartnerLogos.PoweredByCircleDark
        : Logos.PartnerLogos.PoweredByCircleLight,
      theme.isDark
        ? Logos.PartnerLogos.PoweredByParaswapDark
        : Logos.PartnerLogos.PoweredByParaswapLight
    ],
    numColumns: 1,
    itemPadding: 16,
    resourceURL:
      'https://www.figma.com/design/aj9mmgDMaaxZXkuIRKLhIn/Core-Mobile-Redesign-2025?node-id=3263-21440&t=IFcOba3yyNJLDjXt-0'
  })
}
