import React from 'react'
import { Icons, Image, useTheme, View } from '@avalabs/k2-alpine'
import { SvgProps } from 'react-native-svg'
import { PaymentMethods } from '../consts'
import { SearchPaymentMethods } from '../types'

const DEFAULT_SIZE = 24

export const PaymentMethodIcon = ({
  paymentMethod,
  size = DEFAULT_SIZE
}: {
  paymentMethod: SearchPaymentMethods
  size?: number
}): React.JSX.Element | undefined => {
  const {
    theme: { colors, isDark }
  } = useTheme()
  const Icon = paymentMethod.paymentMethod
    ? PAYMENT_METHOD_TO_ICON[paymentMethod.paymentMethod]
    : undefined
  return Icon ? (
    <View
      sx={{
        width: size,
        height: size,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      <Icon
        testID={`icon__${paymentMethod.paymentMethod}`}
        width={size}
        height={size}
        color={colors.$textPrimary}
      />
    </View>
  ) : (
    <Image
      accessibilityRole="image"
      sx={{ width: size, height: size }}
      source={{
        uri: isDark
          ? paymentMethod?.logos?.dark ?? ''
          : paymentMethod?.logos?.light ?? ''
      }}
    />
  )
}

const PAYMENT_METHOD_TO_ICON: Record<
  PaymentMethods,
  React.FC<SvgProps> | undefined
> = {
  [PaymentMethods.APPLEPAY_EU]: Icons.Custom.ApplePay,
  [PaymentMethods.APPLE_PAY]: Icons.Custom.ApplePay,
  [PaymentMethods.PAYPAL]: Icons.Custom.PayPal,
  [PaymentMethods.CREDIT_DEBIT_CARD]: Icons.Custom.CreditCard,
  [PaymentMethods.GOOGLE_PAY]: Icons.Custom.GooglePay,
  [PaymentMethods.BINANCE_CASH_BALANCE]: Icons.Custom.Binance,
  [PaymentMethods.BINANCE_P2P]: Icons.Custom.Binance,
  [PaymentMethods.COINBASE_CASH_BALANCE]: Icons.Custom.Coinbase,
  [PaymentMethods.REVOLUT_PAY]: Icons.Custom.Revolut,
  [PaymentMethods.MOBILE_MONEY]: Icons.Custom.MobileMoney,
  [PaymentMethods.ACH]: Icons.Custom.Ach,
  [PaymentMethods.SAME_DAY_ACH]: Icons.Custom.Ach,
  [PaymentMethods.SHOPEEPAY]: Icons.Custom.ShopeePay,
  [PaymentMethods.SWIFT]: Icons.Custom.BankTransfer,

  [PaymentMethods.BR_BANK_TRANSFER]: Icons.Custom.BankTransfer,
  [PaymentMethods.UAE_BANK_TRANSFER]: Icons.Custom.BankTransfer,
  [PaymentMethods.VN_BANK_TRANSFER]: Icons.Custom.BankTransfer,
  [PaymentMethods.NG_BANK_TRANSFER]: Icons.Custom.BankTransfer,
  [PaymentMethods.TH_BANK_TRANSFER]: Icons.Custom.BankTransfer,
  [PaymentMethods.PH_BANK_TRANSFER]: Icons.Custom.BankTransfer,
  [PaymentMethods.PE_BANK_TRANSFER]: Icons.Custom.BankTransfer,
  [PaymentMethods.MY_BANK_TRANSFER]: Icons.Custom.BankTransfer,
  [PaymentMethods.MX_BANK_TRANSFER]: Icons.Custom.BankTransfer,
  [PaymentMethods.LOCAL_BANK_TRANSFER]: Icons.Custom.BankTransfer,
  [PaymentMethods.ID_BANK_TRANSFER]: Icons.Custom.BankTransfer,
  [PaymentMethods.IN_BANK_TRANSFER]: Icons.Custom.BankTransfer,
  [PaymentMethods.CO_BANK_TRANSFER]: Icons.Custom.BankTransfer,
  [PaymentMethods.CL_BANK_TRANSFER]: Icons.Custom.BankTransfer,
  [PaymentMethods.AR_BANK_TRANSFER]: Icons.Custom.BankTransfer,
  [PaymentMethods.CH_BANK_TRANSFER]: Icons.Custom.BankTransfer,
  [PaymentMethods.DE_BANK_TRANSFER]: Icons.Custom.BankTransfer,
  [PaymentMethods.ES_BANK_TRANSFER]: Icons.Custom.BankTransfer,
  [PaymentMethods.FR_BANK_TRANSFER]: Icons.Custom.BankTransfer,
  [PaymentMethods.IT_BANK_TRANSFER]: Icons.Custom.BankTransfer,
  [PaymentMethods.NL_BANK_TRANSFER]: Icons.Custom.BankTransfer,

  [PaymentMethods.TODITO_CASH]: Icons.Custom.Cash,
  [PaymentMethods.PE_CASH]: Icons.Custom.Cash,
  [PaymentMethods.MX_CASH]: Icons.Custom.Cash,
  [PaymentMethods.EC_CASH]: Icons.Custom.Cash,
  [PaymentMethods.CR_CASH]: Icons.Custom.Cash,
  [PaymentMethods.CO_CASH]: Icons.Custom.Cash,
  [PaymentMethods.DO_CASH]: Icons.Custom.Cash,
  [PaymentMethods.GT_CASH]: Icons.Custom.Cash,
  [PaymentMethods.HN_CASH]: Icons.Custom.Cash,
  [PaymentMethods.NI_CASH]: Icons.Custom.Cash,
  [PaymentMethods.PA_CASH]: Icons.Custom.Cash,
  [PaymentMethods.PH_CASH]: Icons.Custom.Cash,
  [PaymentMethods.PY_CASH]: Icons.Custom.Cash,

  // if there is no custom logo for the payment method, show the default logo provided by Meld
  [PaymentMethods.SPEI]: undefined,
  [PaymentMethods.PAYMAYA]: undefined,
  [PaymentMethods.GCASH]: undefined,
  [PaymentMethods.GRABPAY]: undefined,
  [PaymentMethods.THAI_QR]: undefined,
  [PaymentMethods.FAST]: undefined,
  [PaymentMethods.ROBINHOOD_BUYING_POWER]: undefined,
  [PaymentMethods.QRIS]: undefined,
  [PaymentMethods.OVO]: undefined,
  [PaymentMethods.UPI]: undefined,
  [PaymentMethods.IMPS]: undefined,
  [PaymentMethods.SEPA]: undefined,
  [PaymentMethods.PIX]: undefined,
  [PaymentMethods.KHIPU]: undefined,
  [PaymentMethods.PSE]: undefined,
  [PaymentMethods.VIETQR]: undefined,
  [PaymentMethods.VIETTELPAY]: undefined,
  [PaymentMethods.OPEN_BANKING]: undefined,
  [PaymentMethods.INSTAPAY]: undefined,
  [PaymentMethods.ASTROPAY]: undefined,
  [PaymentMethods.IDEAL]: undefined,
  [PaymentMethods.DUITNOW]: undefined,
  [PaymentMethods.DANA]: undefined,
  [PaymentMethods.SKRILL]: undefined,
  [PaymentMethods.PICPAY]: undefined,
  [PaymentMethods.PAYID]: undefined,
  [PaymentMethods.BANCONTACT]: undefined,
  [PaymentMethods.BRIVA]: undefined,
  [PaymentMethods.EPS]: undefined,
  [PaymentMethods.COINS_PH]: undefined,
  [PaymentMethods.FPX]: undefined,
  [PaymentMethods.NETELLER]: undefined,
  [PaymentMethods.PAY_NOW]: undefined,
  [PaymentMethods.NEFT]: undefined,
  [PaymentMethods.MULTIBANCO]: undefined,
  [PaymentMethods.MOMO]: undefined,
  [PaymentMethods.MPESA]: undefined,
  [PaymentMethods.MANDIRIVA]: undefined,
  [PaymentMethods.STP]: undefined,
  [PaymentMethods.SOFORT]: undefined,
  [PaymentMethods.TOUCH_N_GO]: undefined,
  [PaymentMethods.UK_FASTER_PAYMENTS]: undefined,
  [PaymentMethods.QRPH]: undefined,
  [PaymentMethods.INTERAC]: undefined,
  [PaymentMethods.ZALOPAY]: undefined,
  [PaymentMethods.PROMPTPAY]: undefined,
  [PaymentMethods.BLIK]: undefined,

  [PaymentMethods.PAYOUT_TO_CARD]: undefined
}
