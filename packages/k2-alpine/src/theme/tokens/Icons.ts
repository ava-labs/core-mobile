import IconCheck from '../../assets/icons/check.svg'
import IconExpandMore from '../../assets/icons/expand_more.svg'
import IconBackArrowCustom from '../../assets/icons/back_arrow_custom.svg'
import IconFaceID from '../../assets/icons/face_id.svg'
import IconTouchID from '../../assets/icons/touch_id.svg'
import IconPin from '../../assets/icons/pin.svg'
import IconInfo from '../../assets/icons/info.svg'
import IconCheckCircleOutline from '../../assets/icons/check_circle_outline.svg'
import IconErrorOutline from '../../assets/icons/error_outline.svg'
import IconError from '../../assets/icons/error.svg'
import IconRemoveModerator from '../../assets/icons/remove_moderator.svg'
import IconGPPMaybe from '../../assets/icons/gpp_maybe.svg'
import IconPasskey from '../../assets/icons/passkey.svg'
import IconAuthenticator from '../../assets/icons/authenticator.svg'
import IconYubikey from '../../assets/icons/yubikey.svg'
import IconApple from '../../assets/icons/apple.svg'
import IconGoogle from '../../assets/icons/google.svg'
import IconAdd from '../../assets/icons/add.svg'
import IconArrowForwardIOS from '../../assets/icons/arrow_forward_ios.svg'

export const Icons = {
  Action: {
    Info: IconInfo,
    CheckCircleOutline: IconCheckCircleOutline
  },
  Alert: {
    IconErrorOutline: IconErrorOutline
  },
  Device: {
    IconGPPMaybe: IconGPPMaybe
  },
  Navigation: {
    ArrowForwardIOS: IconArrowForwardIOS,
    Check: IconCheck,
    ExpandMore: IconExpandMore
  },
  Social: {
    RemoveModerator: IconRemoveModerator
  },
  Content: {
    Add: IconAdd
  },
  Custom: {
    BackArrowCustom: IconBackArrowCustom,
    FaceID: IconFaceID,
    TouchID: IconTouchID,
    Pin: IconPin,
    Error: IconError
  },
  RecoveryMethod: {
    Passkey: IconPasskey,
    Authenticator: IconAuthenticator,
    Yubikey: IconYubikey
  },
  Logos: {
    Apple: IconApple,
    Google: IconGoogle
  }
}
