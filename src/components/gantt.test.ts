import { describe, expect, it } from 'vitest'
import './gantt'
import type { AuroraGantt } from './gantt'

const TASKS = [
  { id: 'design', title: 'Design', start: '2026-07-01', end: '2026-07-04', progress: 100 },
  {
    id: 'build',
    title: 'Build',
    start: '2026-07-05',
    end: '2026-07-12',
    progress: 60,
    dependsOn: ['design'],
    color: '#22d3ee',
  },
  { id: 'ship', title: 'Ship', start: '2026-07-13', end: '2026-07-14', dependsOn: ['build'] },
]

describe('aurora-gantt', () => {
  it('lays out one bar per task with progress fills and labels', () => {
    const el = document.createElement('aurora-gantt') as AuroraGantt
    document.body.append(el)
    el.tasks = TASKS
    const bars = el.shadowRoot?.querySelectorAll('.bar')
    expect(bars?.length).toBe(3)
    expect(bars?.[1]?.getAttribute('aria-label')).toBe('Build, 60% done')
    expect((bars?.[1] as HTMLElement)?.style.getPropertyValue('--p')).toBe('60%')
    expect(el.shadowRoot?.querySelectorAll('.names .cell').length).toBe(4)
    el.remove()
  })

  it('draws dependency arrows between linked tasks', () => {
    const el = document.createElement('aurora-gantt') as AuroraGantt
    document.body.append(el)
    el.tasks = TASKS
    expect(el.shadowRoot?.querySelectorAll('svg.deps path').length).toBe(2)
    expect(el.shadowRoot?.querySelectorAll('svg.deps polygon').length).toBe(2)
    el.remove()
  })

  it('positions bars by date on the day scale and emits selection', () => {
    const el = document.createElement('aurora-gantt') as AuroraGantt
    el.setAttribute('day-width', '30')
    document.body.append(el)
    el.tasks = TASKS
    const design = el.shadowRoot?.querySelector<HTMLElement>('.bar[data-id="design"]')
    const build = el.shadowRoot?.querySelector<HTMLElement>('.bar[data-id="build"]')
    expect(design?.style.left).toBe('30px')
    expect(build?.style.left).toBe('150px')
    let picked = ''
    el.addEventListener('aurora-select', (e) => {
      picked = (e as CustomEvent<{ task: { id: string } }>).detail.task.id
    })
    build?.click()
    expect(picked).toBe('build')
    el.remove()
  })
})

describe('gantt drag editing', () => {
  it('moves a task by whole days on bar drag and emits aurora-update', () => {
    const el = document.createElement('aurora-gantt') as AuroraGantt
    el.setAttribute('day-width', '30')
    document.body.append(el)
    el.tasks = JSON.parse(JSON.stringify(TASKS))
    let got: { start: string; end: string } | null = null
    el.addEventListener('aurora-update', (e) => {
      got = (e as CustomEvent<{ start: string; end: string }>).detail
    })
    const bar = el.shadowRoot?.querySelector<HTMLElement>('.bar[data-id="design"]')
    bar?.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 100 }))
    bar?.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 160 }))
    bar?.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: 160 }))
    expect(got).toEqual(expect.objectContaining({ start: '2026-07-03', end: '2026-07-06' }))
    el.remove()
  })

  it('resizes from the grip, clamping at the start date', () => {
    const el = document.createElement('aurora-gantt') as AuroraGantt
    el.setAttribute('day-width', '30')
    document.body.append(el)
    el.tasks = JSON.parse(JSON.stringify(TASKS))
    const bar = el.shadowRoot?.querySelector<HTMLElement>('.bar[data-id="ship"]')
    const grip = bar?.querySelector('.grip')
    grip?.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 200 }))
    bar?.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 260 }))
    bar?.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: 260 }))
    const ship = el.tasks.find((t) => t.id === 'ship')
    expect(ship?.end).toBe('2026-07-16')
    expect(ship?.start).toBe('2026-07-13')
    el.remove()
  })

  it('suppresses editing entirely with readonly', () => {
    const el = document.createElement('aurora-gantt') as AuroraGantt
    el.setAttribute('readonly', '')
    document.body.append(el)
    el.tasks = TASKS
    expect(el.shadowRoot?.querySelector('.grip')).toBeNull()
    el.remove()
  })
})

describe('gantt depth (v1.8)', () => {
  it('switches time scales from the toolbar, compressing the ruler', () => {
    const el = document.createElement('aurora-gantt') as AuroraGantt
    el.setAttribute('day-width', '28')
    document.body.append(el)
    el.tasks = JSON.parse(JSON.stringify(TASKS))
    const dayCells = el.shadowRoot?.querySelectorAll('.scale div').length ?? 0
    el.shadowRoot?.querySelector<HTMLButtonElement>('[data-sc="week"]')?.click()
    expect(el.scale).toBe('week')
    const weekCells = el.shadowRoot?.querySelectorAll('.scale div').length ?? 0
    expect(weekCells).toBeLessThan(dayCells)
    expect(el.shadowRoot?.querySelector('[data-sc="week"]')?.getAttribute('aria-pressed')).toBe(
      'true',
    )
    el.shadowRoot?.querySelector<HTMLButtonElement>('[data-sc="month"]')?.click()
    const monthCells = el.shadowRoot?.querySelectorAll('.scale div').length ?? 0
    expect(monthCells).toBeLessThanOrEqual(weekCells)
    el.remove()
  })

  it('renders planned-vs-actual baselines for tasks with planned dates', () => {
    const el = document.createElement('aurora-gantt') as AuroraGantt
    document.body.append(el)
    el.tasks = [
      {
        id: 'slip',
        title: 'Slipped task',
        start: '2026-07-05',
        end: '2026-07-12',
        plannedStart: '2026-07-01',
        plannedEnd: '2026-07-08',
      },
      { id: 'ontime', title: 'On time', start: '2026-07-02', end: '2026-07-04' },
    ]
    expect(el.shadowRoot?.querySelectorAll('.baseline').length).toBe(1)
    const baseline = el.shadowRoot?.querySelector<HTMLElement>('.baseline[data-for="slip"]')
    const bar = el.shadowRoot?.querySelector<HTMLElement>('.bar[data-id="slip"]')
    expect(parseFloat(baseline?.style.left ?? '0')).toBeLessThan(parseFloat(bar?.style.left ?? '0'))
    el.remove()
  })
})
