import React from 'react'
import { Logos, useTheme, View } from '@avalabs/k2-alpine'
import { SvgProps } from 'react-native-svg'
import { ServiceProviders } from '../consts'

const DEFAULT_SIZE = 27

export const ServiceProviderIcon = ({
  serviceProvider,
  size = DEFAULT_SIZE
}: {
  serviceProvider: ServiceProviders
  size?: number
}): React.JSX.Element | undefined => {
  const {
    theme: { colors }
  } = useTheme()
  const Icon = SERVICE_PROVIDER_TO_ICON[serviceProvider]
  return (
    Icon && (
      <View
        sx={{
          borderColor: colors.$borderPrimary,
          borderWidth: 1,
          borderRadius: 100,
          width: DEFAULT_SIZE,
          height: DEFAULT_SIZE,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.$surfaceSecondary
        }}>
        <Icon
          testID={`icon__${serviceProvider}`}
          width={size}
          height={size}
          color={'green'}
        />
      </View>
    )
  )
}

const SERVICE_PROVIDER_TO_ICON: Record<
  ServiceProviders,
  React.FC<SvgProps> | undefined
> = {
  [ServiceProviders.ALCHEMYPAY]: Logos.PartnerLogos.Alchemy,
  [ServiceProviders.BTCDIRECT]: Logos.PartnerLogos.BtcDirect,
  [ServiceProviders.BANXA]: Logos.PartnerLogos.Banxa,
  [ServiceProviders.BILIRA]: Logos.PartnerLogos.Bilira,
  [ServiceProviders.BINANCECONNECT]: Logos.PartnerLogos.BinanceConnect,
  [ServiceProviders.BLOCKCHAINDOTCOM]: Logos.PartnerLogos.BlockChainDotCom,
  [ServiceProviders.COINBASEPAY]: Logos.PartnerLogos.CoinbasePay,
  [ServiceProviders.COINFLOW]: Logos.PartnerLogos.Coinflow,
  [ServiceProviders.FONBNK]: Logos.PartnerLogos.Fonbnk,
  [ServiceProviders.GUARDARIAN]: Logos.PartnerLogos.Guardarian,
  [ServiceProviders.HARBOUR]: Logos.PartnerLogos.Harbour,
  [ServiceProviders.KOYWE]: Logos.PartnerLogos.Koywe,
  [ServiceProviders.MERCURYO]: Logos.PartnerLogos.Mercuryo,
  [ServiceProviders.MESH]: Logos.PartnerLogos.Mesh,
  [ServiceProviders.ONMETA]: Logos.PartnerLogos.Onmeta,
  [ServiceProviders.PAYPAL]: Logos.PartnerLogos.Paypal,
  [ServiceProviders.REVOLUT]: Logos.PartnerLogos.Revolut,
  [ServiceProviders.ROBINHOOD]: Logos.PartnerLogos.Robinhood,
  [ServiceProviders.SARDINE]: Logos.PartnerLogos.Sardine,
  [ServiceProviders.SHIFT4]: Logos.PartnerLogos.Shift4,
  [ServiceProviders.SIMPLEX]: Logos.PartnerLogos.Simplex,
  [ServiceProviders.TRANSFI]: Logos.PartnerLogos.Transfi,
  [ServiceProviders.TRANSAK]: Logos.PartnerLogos.Transak,
  [ServiceProviders.UNLIMIT]: Logos.PartnerLogos.Unlimit,
  [ServiceProviders.YELLOWCARD]: Logos.PartnerLogos.YellowCard,
  [ServiceProviders.TOPPER]: Logos.PartnerLogos.Topper,
  [ServiceProviders.PAYBIS]: Logos.PartnerLogos.Paybis,
  [ServiceProviders.STRIPE]: Logos.PartnerLogos.Stripe,
  [ServiceProviders.ONRAMPMONEY]: Logos.PartnerLogos.Onramp,

  [ServiceProviders.CHECKOUT]: undefined,
  [ServiceProviders.CIRCLE]: undefined,
  [ServiceProviders.FINICITY]: undefined,
  [ServiceProviders.YODLEE]: undefined,
  [ServiceProviders.AKOYA]: undefined,
  [ServiceProviders.MX]: undefined,
  [ServiceProviders.MESO]: undefined,
  [ServiceProviders.MOOV]: undefined,
  [ServiceProviders.PLAID]: undefined,
  [ServiceProviders.SALTEDGE]: undefined,
  [ServiceProviders.SALTEDGEPARTNERS]: undefined
}
