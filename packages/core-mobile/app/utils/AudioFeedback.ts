import { HapticFeedbackTypes } from 'react-native-haptic-feedback'
import Sound from 'react-native-sound'
import { hapticFeedback } from 'utils/HapticFeedback'
import Logger from 'utils/Logger'

Sound.setCategory('Ambient', true)

type Audio = {
  file: string
  hapticType: HapticFeedbackTypes
}

const audioFiles = {
  Send: {
    file: 'core_send.wav',
    hapticType: HapticFeedbackTypes.notificationSuccess
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
