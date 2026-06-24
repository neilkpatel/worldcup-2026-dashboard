import { useMemo, useState } from 'react'

// Accent-insensitive so "jimenez" matches "Jiménez", "uzbek" matches "Uzbekistan".
const norm = (s) => (s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

// Controlled text input with a typeahead dropdown. `options` is an array of
// strings; as the user types, matches drop down — prefix matches first, then
// substring — and clicking one fills the input. Pure UI over a controlled `value`.
export default function Autocomplete({ value, onChange, options, placeholder, icon, ariaLabel }) {
  const [open, setOpen] = useState(false)
  const q = norm((value || '').trim())

  const matches = useMemo(() => {
    if (!q) return []
    const starts = []
    const contains = []
    for (const o of options) {
      const n = norm(o)
      if (n.startsWith(q)) starts.push(o)
      else if (n.includes(q)) contains.push(o)
    }
    return [...starts, ...contains].slice(0, 8)
  }, [q, options])

  // Hide once the input already equals the only remaining match (nothing to pick).
  const showList = open && matches.length > 0 && !(matches.length === 1 && norm(matches[0]) === q)

  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>
      )}
      <input
        type="search"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true) // reopen on every keystroke, so you can search again after picking
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={`w-full rounded-lg border border-slate-700 bg-slate-900 py-2.5 ${
          icon ? 'pl-9' : 'pl-3'
        } pr-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none`}
      />
      {showList && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-700 bg-slate-900 py-1 shadow-lg shadow-black/40">
          {matches.map((m) => (
            <li key={m}>
              <button
                type="button"
                // onMouseDown (not onClick) fires before the input's blur closes the list.
                onMouseDown={(e) => {
                  e.preventDefault()
                  onChange(m)
                  setOpen(false)
                }}
                className="block w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
              >
                {m}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
