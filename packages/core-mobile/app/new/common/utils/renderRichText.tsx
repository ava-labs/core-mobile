import React, { ReactNode } from 'react'
import { Text as RNText } from 'react-native'
import { Text, View } from '@avalabs/k2-alpine'
import { documentToReactComponents } from '@contentful/rich-text-react-renderer'
import {
  Document,
  BLOCKS,
  INLINES,
  MARKS,
  Block,
  Inline
} from '@contentful/rich-text-types'
import { openInSystemBrowser } from 'utils/openInSystemBrowser'

type Node = Block | Inline

const richTextOptions = {
  /*
   * we are using bare react native text component to render marks
   * in order to preserve the original text style (from k2-alpine)
   * while still being able to apply the different marks (bold, italic,...) to the text
   */
  renderMark: {
    [MARKS.CODE]: () => null,
    [MARKS.SUPERSCRIPT]: () => null,
    [MARKS.SUBSCRIPT]: () => null,
    [MARKS.UNDERLINE]: (text: ReactNode) => (
      <RNText style={{ textDecorationLine: 'underline' }}>{text}</RNText>
    ),
    [MARKS.STRIKETHROUGH]: (text: ReactNode) => (
      <RNText style={{ textDecorationLine: 'line-through' }}>{text}</RNText>
    ),
    [MARKS.BOLD]: (text: ReactNode) => (
      <RNText style={{ fontWeight: 'bold' }}>{text}</RNText>
    ),
    [MARKS.ITALIC]: (text: ReactNode) => (
      <RNText style={{ fontStyle: 'italic' }}>{text}</RNText>
    )
  },
  renderNode: {
    /*
     * we need to return null even for the ones we don't support in the app
     * otherwise, @contentful/rich-text-react-renderer will render using
     * web html elements (e.g. <strong>, <em>, <u>, <s>, etc.)
     * which will throw error in our react native app
     */
    [BLOCKS.EMBEDDED_ENTRY]: () => null,
    [BLOCKS.EMBEDDED_RESOURCE]: () => null,
    [BLOCKS.QUOTE]: () => null,
    [BLOCKS.HR]: () => null,
    [BLOCKS.TABLE]: () => null,
    [BLOCKS.TABLE_ROW]: () => null,
    [BLOCKS.TABLE_HEADER_CELL]: () => null,
    [BLOCKS.TABLE_CELL]: () => null,
    [INLINES.ASSET_HYPERLINK]: () => null,
    [INLINES.ENTRY_HYPERLINK]: () => null,
    [INLINES.RESOURCE_HYPERLINK]: () => null,
    [INLINES.EMBEDDED_ENTRY]: () => null,
    [INLINES.EMBEDDED_RESOURCE]: () => null,
    [INLINES.HYPERLINK]: (node: Node, children: ReactNode) => (
      <Text
        variant="body1"
        onPress={() => {
          openInSystemBrowser(node.data.uri)
        }}>
        {children}
      </Text>
    ),
    [BLOCKS.UL_LIST]: (_node: Node, children: ReactNode) => {
      if (!Array.isArray(children)) return null

      return (
        <View>
          {children.map((child: ReactNode) => {
            return child
          })}
        </View>
      )
    },
    [BLOCKS.OL_LIST]: (_node: Node, children: ReactNode) => {
      if (!Array.isArray(children)) return null

      return children.map((child: ReactNode, index: number) => {
        return (
          <View key={index} sx={{ flexDirection: 'row', width: '97%' }}>
            <Text variant="body1">{index + 1}. </Text>
            <Text variant="body1">{child}</Text>
          </View>
        )
      })
    },
    [BLOCKS.LIST_ITEM]: (_node: Node, child: ReactNode) => {
      return <View>{child}</View>
    },
    [BLOCKS.PARAGRAPH]: (_node: Node, children: ReactNode) => {
      return <Text variant="body1">{children}</Text>
    },
    [BLOCKS.HEADING_1]: (_node: Node, children: ReactNode) => (
      <Text variant="heading2">{children}</Text>
    ),
    [BLOCKS.HEADING_2]: (_node: Node, children: ReactNode) => (
      <Text variant="heading3">{children}</Text>
    ),
    [BLOCKS.HEADING_3]: (_node: Node, children: ReactNode) => (
      <Text variant="heading4">{children}</Text>
    ),
    [BLOCKS.HEADING_4]: (_node: Node, children: ReactNode) => (
      <Text variant="heading5">{children}</Text>
    ),
    [BLOCKS.HEADING_5]: (_node: Node, children: ReactNode) => (
      <Text variant="heading6">{children}</Text>
    ),
    [BLOCKS.HEADING_6]: (_node: Node, children: ReactNode) => (
      <Text variant="heading6">{children}</Text>
    )
  }
}

export const renderRichText = (richText: Document): ReactNode => {
  return documentToReactComponents(richText, richTextOptions)
}
