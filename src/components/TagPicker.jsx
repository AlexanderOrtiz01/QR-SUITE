import { Field } from './ui.jsx'

export function TagPicker({ options, value, onChange, label = 'Etiquetas' }) {
  function toggle(tag) {
    onChange(
      value.includes(tag)
        ? value.filter((item) => item !== tag)
        : [...value, tag],
    )
  }

  return (
    <Field label={label} hint="Capítulo, unidad o tipo de recurso.">
      <div className="flex flex-wrap gap-2">
        {options.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              value.includes(tag)
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </Field>
  )
}
