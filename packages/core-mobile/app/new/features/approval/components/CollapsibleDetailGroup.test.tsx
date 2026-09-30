import React from 'react'
import renderer, { act } from 'react-test-renderer'

jest.mock('@avalabs/k2-alpine', () => {
  const ReactActual = jest.requireActual('react')
  const passThrough =
    (name: string) =>
    (
      props: React.PropsWithChildren<Record<string, unknown>>
    ): React.ReactNode =>
      ReactActual.createElement(name, props, props.children)
  return {
    View: passThrough('View'),
    Text: passThrough('Text'),
    Pressable: passThrough('Pressable'),
    Icons: { Navigation: { ChevronRight: passThrough('ChevronRight') } },
    useTheme: () => ({ theme: { colors: { $textSecondary: '#999' } } })
  }
})

import { CollapsibleDetailGroup } from './CollapsibleDetailGroup'

const LABEL = 'Transfer details'

const renderGroup = async (
  renderContent: () => React.ReactNode
): Promise<renderer.ReactTestRenderer> => {
  let instance!: renderer.ReactTestRenderer
  await act(async () => {
    instance = renderer.create(
      <CollapsibleDetailGroup
        label={LABEL}
        verticalPadding={13}
        renderContent={renderContent}
      />
    )
  })
  return instance
}

const header = (
  instance: renderer.ReactTestRenderer
): renderer.ReactTestInstance =>
  instance.root.findByProps({ testID: `collapsible_group__${LABEL}` })

const toggle = async (instance: renderer.ReactTestRenderer): Promise<void> => {
  await act(async () => {
    ;(header(instance).props.onPress as () => void)()
  })
}

const content = (): React.ReactNode =>
  React.createElement('GroupContent', { testID: 'group_content' })

describe('<CollapsibleDetailGroup />', () => {
  it('is closed by default and does not build its content', async () => {
    const renderContent = jest.fn(content)
    const instance = await renderGroup(renderContent)

    expect(renderContent).not.toHaveBeenCalled()
    expect(
      instance.root.findAllByProps({ testID: 'group_content' })
    ).toHaveLength(0)
    expect(header(instance).props.accessibilityState).toEqual({
      expanded: false
    })
  })

  it('opens on press and renders its content', async () => {
    const renderContent = jest.fn(content)
    const instance = await renderGroup(renderContent)

    await toggle(instance)

    expect(renderContent).toHaveBeenCalled()
    expect(
      instance.root.findAllByProps({ testID: 'group_content' }).length
    ).toBeGreaterThan(0)
    expect(header(instance).props.accessibilityState).toEqual({
      expanded: true
    })
  })

  it('closes again on a second press', async () => {
    const instance = await renderGroup(content)

    await toggle(instance)
    await toggle(instance)

    expect(
      instance.root.findAllByProps({ testID: 'group_content' })
    ).toHaveLength(0)
    expect(header(instance).props.accessibilityState).toEqual({
      expanded: false
    })
  })
})
