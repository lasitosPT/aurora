import { AuroraElement } from '../core/base'
import { escapeHtml } from '../core/html'
import { clamp } from '../core/motion'
import { register } from '../core/register'

const STYLE = `
  :host {
    display: block; position: relative; overflow: hidden; border-radius: 16px;
    background: #000; color: #fff;
    border: 1px solid var(--aurora-border, rgba(255, 255, 255, 0.12));
  }
  video { display: block; width: 100%; height: auto; }
  .bar {
    position: absolute; left: 0; right: 0; bottom: 0; display: flex; align-items: center;
    gap: 12px; padding: 26px 14px 10px; font-size: 0.8rem; font-variant-numeric: tabular-nums;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.75), transparent);
    opacity: 0; transition: opacity 0.25s ease;
  }
  :host(:hover) .bar, :host(:focus-within) .bar, :host([paused]) .bar { opacity: 1; }
  .bar button {
    all: unset; cursor: pointer; width: 30px; height: 30px; display: grid; place-items: center;
    border-radius: 8px; font-size: 0.95rem;
  }
  .bar button:hover { background: rgba(255, 255, 255, 0.14); }
  .bar button:focus-visible { outline: 2px solid var(--aurora-accent, #6d5cff); }
  .seek {
    flex: 1; height: 5px; border-radius: 3px; cursor: pointer; position: relative;
    background: rgba(255, 255, 255, 0.22); touch-action: none;
  }
  .seek .fill {
    position: absolute; left: 0; top: 0; bottom: 0; border-radius: 3px; width: 0;
    background: var(--aurora-accent, #6d5cff);
  }
  .vol { width: 60px; height: 5px; border-radius: 3px; cursor: pointer; position: relative; background: rgba(255,255,255,0.22); }
  .vol .fill { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 3px; background: #fff; }
  .big {
    position: absolute; inset: 0; display: grid; place-items: center; cursor: pointer;
    opacity: 0; transition: opacity 0.2s ease; background: rgba(0, 0, 0, 0.25);
  }
  :host([paused]) .big { opacity: 1; }
  .big span {
    width: 64px; height: 64px; border-radius: 50%; display: grid; place-items: center;
    font-size: 1.5rem; background: color-mix(in srgb, var(--aurora-accent, #6d5cff) 85%, transparent);
    padding-left: 4px;
  }
`

/**
 * `<aurora-videoplayer src="…">` — a video player with aurora chrome:
 * click-anywhere play/pause with a center badge, an accent seek bar, time
 * readout, volume scrubber, mute, and fullscreen, all auto-hiding during
 * playback. Emits `aurora-play`, `aurora-pause`, and `aurora-ended`.
 */
export class AuroraVideoplayer extends AuroraElement {
  private video: HTMLVideoElement | null = null

  connectedCallback(): void {
    const src = this.getAttribute('src') ?? ''
    const poster = this.getAttribute('poster')
    this.setAttribute('paused', '')
    this.root.innerHTML = `<style>${STYLE}</style>
      <video part="video" src="${escapeHtml(src)}"${poster ? ` poster="${escapeHtml(poster)}"` : ''} playsinline preload="metadata"></video>
      <div class="big" part="overlay"><span aria-hidden="true">▶</span></div>
      <div class="bar" part="bar">
        <button class="pp" aria-label="Play">▶</button>
        <span class="time">0:00 / 0:00</span>
        <div class="seek" part="seek" role="slider" aria-label="Seek" tabindex="0"><div class="fill"></div></div>
        <button class="mute" aria-label="Mute">🔊</button>
        <div class="vol" role="slider" aria-label="Volume"><div class="fill" style="width:100%"></div></div>
        <button class="fs" aria-label="Fullscreen">⛶</button>
      </div>`
    this.video = this.root.querySelector('video')
    const video = this.video
    if (!video) return
    const fmt = (s: number): string => {
      if (!Number.isFinite(s)) return '0:00'
      const m = Math.floor(s / 60)
      const sec = String(Math.floor(s % 60)).padStart(2, '0')
      return `${m}:${sec}`
    }
    const sync = (): void => {
      const fill = this.root.querySelector<HTMLElement>('.seek .fill')
      if (fill && video.duration)
        fill.style.width = `${(video.currentTime / video.duration) * 100}%`
      const time = this.root.querySelector('.time')
      if (time) time.textContent = `${fmt(video.currentTime)} / ${fmt(video.duration)}`
      this.root
        .querySelector('.seek')
        ?.setAttribute('aria-valuenow', String(Math.round(video.currentTime)))
    }
    video.addEventListener('timeupdate', sync)
    video.addEventListener('loadedmetadata', sync)
    video.addEventListener('play', () => {
      this.removeAttribute('paused')
      const pp = this.root.querySelector('.pp')
      if (pp) {
        pp.textContent = '❚❚'
        pp.setAttribute('aria-label', 'Pause')
      }
      this.dispatchEvent(new CustomEvent('aurora-play'))
    })
    video.addEventListener('pause', () => {
      this.setAttribute('paused', '')
      const pp = this.root.querySelector('.pp')
      if (pp) {
        pp.textContent = '▶'
        pp.setAttribute('aria-label', 'Play')
      }
      this.dispatchEvent(new CustomEvent('aurora-pause'))
    })
    video.addEventListener('ended', () => this.dispatchEvent(new CustomEvent('aurora-ended')))
    const togglePlay = (): void => {
      if (video.paused) void video.play()
      else video.pause()
    }
    this.root.querySelector('.pp')?.addEventListener('click', togglePlay)
    this.root.querySelector('.big')?.addEventListener('click', togglePlay)
    const seek = this.root.querySelector<HTMLElement>('.seek')
    const seekTo = (e: PointerEvent): void => {
      const r = seek?.getBoundingClientRect()
      if (!r || !r.width || !video.duration) return
      video.currentTime = clamp((e.clientX - r.left) / r.width, 0, 1) * video.duration
      sync()
    }
    seek?.addEventListener('pointerdown', (e) => {
      seek.setPointerCapture?.(e.pointerId)
      seekTo(e)
    })
    seek?.addEventListener('pointermove', (e) => {
      if (e.buttons) seekTo(e)
    })
    seek?.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
      e.preventDefault()
      video.currentTime = clamp(
        video.currentTime + (e.key === 'ArrowRight' ? 5 : -5),
        0,
        video.duration || 0,
      )
      sync()
    })
    const mute = this.root.querySelector<HTMLButtonElement>('.mute')
    mute?.addEventListener('click', () => {
      video.muted = !video.muted
      mute.textContent = video.muted ? '🔇' : '🔊'
      const vfill = this.root.querySelector<HTMLElement>('.vol .fill')
      if (vfill) vfill.style.width = video.muted ? '0%' : `${video.volume * 100}%`
    })
    const vol = this.root.querySelector<HTMLElement>('.vol')
    vol?.addEventListener('pointerdown', (e) => {
      const r = vol.getBoundingClientRect()
      if (!r.width) return
      video.volume = clamp((e.clientX - r.left) / r.width, 0, 1)
      video.muted = false
      if (mute) mute.textContent = '🔊'
      const vfill = vol.querySelector<HTMLElement>('.fill')
      if (vfill) vfill.style.width = `${video.volume * 100}%`
    })
    this.root.querySelector('.fs')?.addEventListener('click', () => {
      if (document.fullscreenElement) void document.exitFullscreen()
      else void this.requestFullscreen?.()
    })
  }

  play(): void {
    void this.video?.play()
  }

  pause(): void {
    this.video?.pause()
  }
}

register('aurora-videoplayer', AuroraVideoplayer)
