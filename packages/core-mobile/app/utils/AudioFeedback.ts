import Sound from 'react-native-sound'
import { hapticFeedback } from 'utils/HapticFeedback'
import Logger from 'utils/Logger'
import { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics'

// Ambient: Follows silent mode, mixes with other app audio, used for background music/effects.
Sound.setCategory('Ambient', true)

type Audio = {
  file: string
  hapticType: ImpactFeedbackStyle | NotificationFeedbackType
}

export const audioFiles = {
  Default: {
    file: 'default.wav',
    hapticType: ImpactFeedbackStyle.Soft
  },
  Send: {
    file: 'core_send.wav',
    hapticType: NotificationFeedbackType.Success
  },
  Receive: {
    file: 'core_receive.wav',
    hapticType: NotificationFeedbackType.Success
  }
}

type AudiosType = {
  [K in keyof typeof audioFiles]: Audio
}

export const Audios: AudiosType = audioFiles

export const audioFeedback = (audio: Audio, withHaptic = true): void => {
  const sound = new Sound(audio.file, Sound.MAIN_BUNDLE, error => {
    if (error) {
      Logger.error(`failed to load the sound in path, ${audio.file}`, error)

      return
    }
    sound.play(() => {
      sound.release()
    })

    if (withHaptic) {
      hapticFeedback(audio.hapticType)
    }
  })
}
