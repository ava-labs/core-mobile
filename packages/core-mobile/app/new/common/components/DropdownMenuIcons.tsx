import { ImageURISource } from 'react-native'
import Logger from 'utils/Logger'

// Dark
import AddDark from '../../assets/icons/menu/add.png'
import BackDark from '../../assets/icons/menu/arrow_back.png'
import BackDisabledDark from '../../assets/icons/menu/arrow_back_disabled.png'
import ForwardDark from '../../assets/icons/menu/arrow_forward.png'
import ForwardDisabledDark from '../../assets/icons/menu/arrow_forward_disabled.png'
import CheckDark from '../../assets/icons/menu/check.png'
import CloseDark from '../../assets/icons/menu/close.png'
import CloseDestructive from '../../assets/icons/menu/close_destructive.png'
import FavoriteOnDark from '../../assets/icons/menu/favorite_off.png'
import FavoriteOffDark from '../../assets/icons/menu/favorite_on.png'
import HistoryDark from '../../assets/icons/menu/history.png'
import RefreshDark from '../../assets/icons/menu/refresh.png'
import RefreshDisabledDark from '../../assets/icons/menu/refresh_disabled.png'
import ShareDark from '../../assets/icons/menu/share.png'

// Light
import AddLight from '../../assets/icons/menu/add_light.png'
import BackLight from '../../assets/icons/menu/arrow_back_light.png'
import BackDisabledLight from '../../assets/icons/menu/arrow_back_light_disabled.png'
import ForwardLight from '../../assets/icons/menu/arrow_forward_light.png'
import ForwardDisabledLight from '../../assets/icons/menu/arrow_forward_light_disabled.png'
import CheckLight from '../../assets/icons/menu/check_light.png'
import CloseLight from '../../assets/icons/menu/close_light.png'
import FavoriteOffLight from '../../assets/icons/menu/favorite_off_light.png'
import FavoriteOnLight from '../../assets/icons/menu/favorite_on_light.png'
import HistoryLight from '../../assets/icons/menu/history_light.png'
import RefreshLight from '../../assets/icons/menu/refresh_light.png'
import RefreshDisabledLight from '../../assets/icons/menu/refresh_light_disabled.png'
import ShareLight from '../../assets/icons/menu/share_light.png'

// icon names are 1 to 1 with the filenames in the android/ios drawable folders
export enum DropdownMenuIcon {
  Add = 'add',
  History = 'history',
  ArrowBack = 'arrow_back',
  ArrowForward = 'arrow_forward',
  Refresh = 'refresh',
  Share = 'share',
  FavoriteOn = 'favorite_on',
  FavoriteOff = 'favorite_off',
  Close = 'close',
  Check = 'check'
}

export function getPlatformIcons(
  name?: DropdownMenuIcon,
  isDark?: boolean,
  options?: {
    disabled?: boolean
    destructive?: boolean
  }
): {
  ios: ImageURISource | null
  android: string | null
} {
  const theme = isDark ? 'Dark' : 'Light'

  if (!name)
    return {
      ios: null,
      android: null
    }

  try {
    if (options?.destructive) {
      const destructiveName = `${name}_destructive` as DropdownMenuIcon
      return {
        ios: DropdownMenuIcons[theme][destructiveName],
        android: name
      }
    }

    if (options?.disabled) {
      const disabledName = `${name}_disabled` as DropdownMenuIcon
      return {
        ios: DropdownMenuIcons[theme][disabledName],
        android: name
      }
    }
    return {
      ios: DropdownMenuIcons[theme][name],
      android: name
    }
  } catch (error) {
    Logger.error(`${name} is not a valid icon name`)
    return {
      ios: null,
      android: null
    }
  }
}

export const DropdownMenuIcons = {
  Light: {
    [DropdownMenuIcon.Add]: AddDark,
    [DropdownMenuIcon.History]: HistoryDark,
    [DropdownMenuIcon.ArrowBack]: BackDark,
    [`${DropdownMenuIcon.ArrowBack}_disabled`]: BackDisabledDark,
    [DropdownMenuIcon.ArrowForward]: ForwardDark,
    [`${DropdownMenuIcon.ArrowForward}_disabled`]: ForwardDisabledDark,
    [DropdownMenuIcon.Refresh]: RefreshDark,
    [`${DropdownMenuIcon.Refresh}_disabled`]: RefreshDisabledDark,
    [DropdownMenuIcon.Share]: ShareDark,
    [DropdownMenuIcon.FavoriteOn]: FavoriteOnDark,
    [DropdownMenuIcon.FavoriteOff]: FavoriteOffDark,
    [DropdownMenuIcon.Close]: CloseDark,
    [`${DropdownMenuIcon.Close}_destructive`]: CloseDestructive,
    [DropdownMenuIcon.Check]: CheckDark
  },
  Dark: {
    [DropdownMenuIcon.Add]: AddLight,
    [DropdownMenuIcon.History]: HistoryLight,
    [DropdownMenuIcon.ArrowBack]: BackLight,
    [`${DropdownMenuIcon.ArrowBack}_disabled`]: BackDisabledLight,
    [`${DropdownMenuIcon.ArrowForward}_disabled`]: ForwardDisabledLight,
    [DropdownMenuIcon.ArrowForward]: ForwardLight,
    [DropdownMenuIcon.Refresh]: RefreshLight,
    [`${DropdownMenuIcon.Refresh}_disabled`]: RefreshDisabledLight,
    [DropdownMenuIcon.Share]: ShareLight,
    [DropdownMenuIcon.FavoriteOn]: FavoriteOnLight,
    [DropdownMenuIcon.FavoriteOff]: FavoriteOffLight,
    [DropdownMenuIcon.Close]: CloseLight,
    [`${DropdownMenuIcon.Close}_destructive`]: CloseDestructive,
    [DropdownMenuIcon.Check]: CheckLight
  }
}
