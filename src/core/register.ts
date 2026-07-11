/** Define a custom element, ignoring duplicate registrations (safe to call repeatedly). */
export function register(name: string, ctor: CustomElementConstructor): void {
  if (typeof customElements !== 'undefined' && !customElements.get(name)) {
    customElements.define(name, ctor)
  }
}
