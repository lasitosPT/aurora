import { describe, expect, it } from 'vitest'
import './command'
import type { AuroraCommand } from './command'

function buildPalette(): AuroraCommand {
  const cmd = document.createElement('aurora-command') as AuroraCommand
  cmd.setAttribute('hotkey', 'none')
  cmd.innerHTML =
    '<button data-value="home">Go home</button>' +
    '<button data-value="docs" data-keywords="manual">Open docs</button>' +
    '<button data-value="toast">Show toast</button>'
  document.body.append(cmd)
  return cmd
}

describe('aurora-command', () => {
  it('is registered as a custom element', () => {
    expect(customElements.get('aurora-command')).toBeTypeOf('function')
  })

  it('opens, filters by text and keywords, and marks the active option', () => {
    const cmd = buildPalette()
    cmd.show()
    const input = cmd.shadowRoot?.querySelector('input')
    expect(input).not.toBeNull()
    expect(cmd.querySelectorAll('button[role="option"]').length).toBe(3)

    input!.value = 'manual'
    input!.dispatchEvent(new Event('input'))
    const visible = Array.from(cmd.querySelectorAll('button')).filter((b) => !b.hidden)
    expect(visible.length).toBe(1)
    expect(visible[0]?.dataset.value).toBe('docs')
    expect(visible[0]?.classList.contains('aurora-active')).toBe(true)

    input!.value = 'zzz'
    input!.dispatchEvent(new Event('input'))
    const empty = cmd.shadowRoot?.querySelector<HTMLElement>('.empty')
    expect(empty?.style.display).toBe('block')
    cmd.hide()
    cmd.remove()
  })

  it('selects the active item on Enter and emits aurora-select', () => {
    const cmd = buildPalette()
    cmd.show()
    let selected = ''
    cmd.addEventListener('aurora-select', (event) => {
      selected = (event as CustomEvent<{ value: string }>).detail.value
    })
    const input = cmd.shadowRoot?.querySelector('input')
    input?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    input?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(selected).toBe('docs')
    cmd.remove()
  })
})
