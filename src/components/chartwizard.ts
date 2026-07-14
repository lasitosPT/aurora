import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { register } from '../core/register'
import './buttongroup'
import './chart'
import type { AuroraButtongroup } from './buttongroup'
import type { AuroraChart, ChartSeries } from './chart'

export interface ChartWizardConfig {
  type: string
  labelField: string
  valueFields: string[]
}

const TYPES = ['bar', 'line', 'area', 'pie', 'donut', 'scatter']

const STYLE = `
  :host {
    display: block; font-size: 0.88rem; color: var(--aurora-fg, #ececf2);
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
    border-radius: 16px; background: var(--aurora-surface, #14141f); padding: 16px;
  }
  .row { display: flex; gap: 14px; flex-wrap: wrap; align-items: flex-end; margin-bottom: 16px; }
  label { display: grid; gap: 5px; font-size: 0.74rem; color: var(--aurora-muted, #9a98b3); }
  select {
    all: unset; box-sizing: border-box; appearance: auto; cursor: pointer;
    padding: 0.45rem 0.7rem; font: inherit; font-size: 0.88rem;
    background: var(--aurora-field, rgba(255, 255, 255, 0.045));
    border: 1px solid var(--aurora-border, rgba(128, 128, 128, 0.4)); border-radius: 9px;
  }
  select:focus { border-color: var(--aurora-accent, #6d5cff); }
`

/**
 * `<aurora-chartwizard>` — point it at flat rows and configure a chart
 * interactively: a composed segmented control picks the type, selects pick
 * the category and value fields (string vs numeric fields are detected), and
 * a live `<aurora-chart>` preview updates on every change. Read `config` or
 * listen for `aurora-change`.
 */
export class AuroraChartwizard extends AuroraElement {
  #data: Record<string, unknown>[] = []
  private type = 'bar'
  private labelField = ''
  private valueField = ''
  private compareField = ''

  get data(): Record<string, unknown>[] {
    return this.#data
  }

  set data(rows: Record<string, unknown>[]) {
    this.#data = rows ?? []
    const sample = this.#data[0] ?? {}
    const strings = Object.keys(sample).filter((k) => typeof sample[k] === 'string')
    const numbers = Object.keys(sample).filter((k) => typeof sample[k] === 'number')
    this.labelField = strings[0] ?? ''
    this.valueField = numbers[0] ?? ''
    this.compareField = ''
    this.render()
  }

  get config(): ChartWizardConfig {
    return {
      type: this.type,
      labelField: this.labelField,
      valueFields: [this.valueField, this.compareField].filter(Boolean),
    }
  }

  connectedCallback(): void {
    this.render()
  }

  private fields(kind: 'string' | 'number'): string[] {
    const sample = this.#data[0] ?? {}
    return Object.keys(sample).filter((k) => typeof sample[k] === kind)
  }

  private render(): void {
    const strings = this.fields('string')
    const numbers = this.fields('number')
    const sel = (name: string, options: string[], current: string, blank = false): string =>
      `<label>${escapeHtml(name)}<select data-s="${escapeHtml(name)}">${blank ? `<option value="" ${current === '' ? 'selected' : ''}>(none)</option>` : ''}${options
        .map(
          (o) =>
            `<option value="${escapeHtml(o)}" ${o === current ? 'selected' : ''}>${escapeHtml(o)}</option>`,
        )
        .join('')}</select></label>`
    this.root.innerHTML = `<style>${STYLE}</style>
      <div class="row">
        <label>Type<aurora-buttongroup value="${escapeHtml(this.type)}">${TYPES.map((t) => `<option value="${t}">${t}</option>`).join('')}</aurora-buttongroup></label>
        ${sel('Category', strings, this.labelField)}
        ${sel('Value', numbers, this.valueField)}
        ${sel('Compare', numbers, this.compareField, true)}
      </div>
      <aurora-chart part="preview" type="${escapeHtml(this.type)}" style="--aurora-chart-height: 200px"></aurora-chart>`
    const group = this.root.querySelector('aurora-buttongroup') as AuroraButtongroup | null
    group?.addEventListener('aurora-change', (e) => {
      e.stopPropagation()
      this.type = (e as CustomEvent<{ value: string }>).detail.value
      this.render()
      this.emit()
    })
    this.root.querySelectorAll<HTMLSelectElement>('select[data-s]').forEach((select) =>
      select.addEventListener('change', () => {
        const which = select.dataset['s']
        if (which === 'Category') this.labelField = select.value
        else if (which === 'Value') this.valueField = select.value
        else this.compareField = select.value
        this.render()
        this.emit()
      }),
    )
    this.preview()
  }

  private preview(): void {
    const chart = this.root.querySelector('aurora-chart') as AuroraChart | null
    if (!chart || !this.#data.length || !this.labelField || !this.valueField) return
    chart.labels = this.#data.map((r) => String(r[this.labelField] ?? ''))
    const series: ChartSeries[] = [
      { label: this.valueField, data: this.#data.map((r) => Number(r[this.valueField]) || 0) },
    ]
    if (this.compareField)
      series.push({
        label: this.compareField,
        data: this.#data.map((r) => Number(r[this.compareField]) || 0),
        color: '#f472b6',
      })
    chart.series = series
  }

  private emit(): void {
    this.dispatchEvent(new CustomEvent('aurora-change', { detail: { config: this.config } }))
  }
}

register('aurora-chartwizard', AuroraChartwizard)
