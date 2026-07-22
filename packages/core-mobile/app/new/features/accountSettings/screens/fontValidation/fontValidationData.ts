// Data for the FontValidation QA screen (CP-14859). Unlike the FontSample
// screen (which reads live catalog strings), these are *curated* stress samples:
// each paragraph is authored to exercise, in one wrapping block, everything
// worth validating about text rendering per language — tall glyphs (CJK
// ideographs, Devanagari matras), diacritics/Cyrillic, script-specific
// punctuation, and (via the shared mixed line) Latin + digits + currency +
// percent sitting inside a non-Latin run. The k2-alpine Text primitive applies
// the post-fix per-script lineHeight automatically, so the screen just renders
// these across a spread of variants.

import type { TextVariant } from '@avalabs/k2-alpine'

// Appended to every paragraph so each language also validates Latin glyphs,
// digits, a currency amount, a token ticker and a percent inside its script run.
export const FONT_VALIDATION_MIXED_LINE = 'AVAX · $1,234.56 · 0.5 AVAX · 100%'

type FontValidationSample = {
  code: string
  label: string
  paragraph: string
}

const withMixedLine = (sentence: string): string =>
  `${sentence}\n${FONT_VALIDATION_MIXED_LINE}`

export const FONT_VALIDATION_SAMPLES: FontValidationSample[] = [
  {
    code: 'en-US',
    label: 'English',
    paragraph: withMixedLine(
      'The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.'
    )
  },
  {
    code: 'zh-CN',
    label: '简体中文',
    paragraph: withMixedLine(
      '视觉设计需要在不同的字号和行高下保持清晰。敏捷的棕色狐狸跳过了懒惰的狗，价格上涨了百分之五！'
    )
  },
  {
    code: 'zh-TW',
    label: '繁體中文',
    paragraph: withMixedLine(
      '視覺設計需要在不同的字型大小與行高下保持清晰。敏捷的棕色狐狸跳過了懶惰的狗，價格上漲了百分之五！'
    )
  },
  {
    code: 'ja-JP',
    label: '日本語',
    paragraph: withMixedLine(
      '視覚デザインは、さまざまなフォントサイズと行の高さでも読みやすさを保つ必要があります。すばやい茶色の狐が、のんびりした犬を飛び越えました。'
    )
  },
  {
    code: 'ko-KR',
    label: '한국어',
    paragraph: withMixedLine(
      '시각 디자인은 다양한 글꼴 크기와 줄 높이에서도 가독성을 유지해야 합니다. 빠른 갈색 여우가 게으른 개를 뛰어넘었습니다.'
    )
  },
  {
    code: 'hi-IN',
    label: 'हिन्दी',
    paragraph: withMixedLine(
      'दृश्य डिज़ाइन को विभिन्न फ़ॉन्ट आकारों और पंक्ति ऊँचाइयों में स्पष्ट रहना चाहिए। तेज़ भूरी लोमड़ी आलसी कुत्ते के ऊपर से कूद गई।'
    )
  },
  {
    code: 'fr-FR',
    label: 'Français',
    paragraph: withMixedLine(
      'Le garçon déçu buvait un café crème à la terrasse. Voix ambiguë d’un cœur qui au zéphyr préfère les jattes de kiwis.'
    )
  },
  {
    code: 'de-DE',
    label: 'Deutsch',
    paragraph: withMixedLine(
      'Zwölf Boxkämpfer jagen Viktor quer über den großen Sylter Deich. Falsches Üben von Xylophonmusik quält jeden größeren Zwerg.'
    )
  },
  {
    code: 'es-ES',
    label: 'Español',
    paragraph: withMixedLine(
      'El veloz murciélago hindú comía feliz cardillo y kiwi. La cigüeña añeja tocaba el saxofón. ¿Qué tal?'
    )
  },
  {
    code: 'ru-RU',
    label: 'Русский',
    paragraph: withMixedLine(
      'Съешь же ещё этих мягких французских булок, да выпей чаю. В чащах юга жил бы цитрус? Да, но фальшивый экземпляр!'
    )
  },
  {
    code: 'tr-TR',
    label: 'Türkçe',
    paragraph: withMixedLine(
      'Pijamalı hasta yağız şoföre çabucak güvendi. Öküz ağıl önünde çamur içinde yatıyordu.'
    )
  }
]

// A representative spread of k2-alpine Text variants covering the three bundled
// font families and a range of sizes/weights, so the post-fix lineHeight is
// visible per variant. The screen reads each variant's fontFamily/fontSize from
// `theme.text[variant]` at runtime.
export const FONT_VALIDATION_VARIANTS: TextVariant[] = [
  'heading2',
  'heading5',
  'body1',
  'buttonMedium',
  'caption',
  'mono'
]
