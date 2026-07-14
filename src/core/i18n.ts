/* Localizable UI strings. Components read through t() at render time, so
   calling setMessages() before creating elements (or re-rendering after)
   localizes the whole library. */

const DEFAULTS: Record<string, string> = {
  'grid.search': 'Search…',
  'grid.exportCsv': 'Export CSV',
  'grid.exportExcel': 'Export Excel',
  'grid.empty': 'No matching rows.',
  'grid.of': 'of',
  'grid.perPage': '/ page',
  'grid.sortAsc': '↑ Sort ascending',
  'grid.sortDesc': '↓ Sort descending',
  'grid.clearSort': '✕ Clear sort',
  'grid.hideColumn': 'Hide column',
  'grid.freeze': 'Freeze column',
  'grid.unfreeze': 'Unfreeze column',
  'grid.clearValueFilter': 'Clear value filter',
  'grid.editRow': 'Edit row',
  'grid.save': 'Save',
  'grid.cancel': 'Cancel',
  'form.required': 'This field is required',
  'form.min': 'Must be at least {0}',
  'form.max': 'Must be at most {0}',
  'form.pattern': 'Invalid format',
  'form.email': 'Enter a valid email',
  'form.invalid': 'Invalid value',
  'scheduler.day': 'Day',
  'scheduler.week': 'Week',
  'scheduler.month': 'Month',
  'scheduler.agenda': 'Agenda',
  'scheduler.empty': 'No events in this range.',
  'listview.empty': 'No items',
  'listbox.empty': 'Empty',
  'filemanager.empty': 'This folder is empty',
  'filter.matchAll': 'ALL',
  'filter.matchAny': 'ANY',
  'filter.matchLabel': 'Match {0} of the rules',
  'filter.addRule': '+ Add rule',
  'filter.value': 'Value…',
  'pdf.loading': 'Loading document…',
  'pdf.error': 'Could not load the document',
  'captcha.placeholder': 'Type it…',
  'captcha.verified': '✓ Verified',
  'chat.placeholder': 'Type a message…',
  'chat.send': 'Send',
  'prompt.placeholder': 'Ask anything…',
  'pager.prev': 'Previous page',
  'pager.next': 'Next page',
  'signature.hint': 'Sign here',
  'upload.browse': 'Browse…',
}

let messages: Record<string, string> = { ...DEFAULTS }

/** Merge message overrides (e.g. a locale pack). Pass nothing to reset. */
export function setMessages(overrides?: Record<string, string>): void {
  messages = overrides ? { ...DEFAULTS, ...overrides } : { ...DEFAULTS }
}

/** Resolve a UI string; `{0}` is replaced with `arg` when given. */
export function t(key: string, arg?: string | number): string {
  const template = messages[key] ?? DEFAULTS[key] ?? key
  return arg === undefined ? template : template.replace('{0}', String(arg))
}
